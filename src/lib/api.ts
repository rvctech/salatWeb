import type { CalcMethod, PlaceSuggestion, PrayerData } from "./types";

const ALADHAN = "https://api.aladhan.com/v1";
const NOMINATIM = "https://nominatim.openstreetmap.org";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

/** Common calculation methods exposed by the Aladhan API. */
export const PRAYER_METHODS: CalcMethod[] = [
  { id: 3, name: "Muslim World League", region: "Global · default" },
  { id: 2, name: "ISNA", region: "North America" },
  { id: 4, name: "Umm al-Qura", region: "Makkah, Saudi Arabia" },
  { id: 5, name: "Egyptian Authority", region: "Egypt" },
  { id: 1, name: "Univ. of Karachi", region: "Pakistan / India / BD" },
  { id: 8, name: "Gulf Region", region: "Gulf / UAE" },
  { id: 9, name: "Kuwait", region: "Kuwait" },
  { id: 10, name: "Qatar", region: "Qatar" },
  { id: 13, name: "Diyanet", region: "Turkey" },
  { id: 12, name: "UOIF", region: "France" },
  { id: 0, name: "Jafari (Shia)", region: "Levant / Iran" },
];

export const DEFAULT_METHOD = 3;

export const THEMES = [
  { id: "default", name: "Teal Night", bg: "#04161c", accent: "#1d8a82", gold: "#e9c97f" },
  { id: "light", name: "Light", bg: "#f8f6f0", accent: "#2563eb", gold: "#b8860b" },
  { id: "midnight", name: "Midnight Blue", bg: "#0a0e27", accent: "#60a5fa", gold: "#e9c97f" },
  { id: "desert", name: "Desert Sand", bg: "#f5e6c8", accent: "#c2790a", gold: "#8b6914" },
  { id: "purple", name: "Royal Purple", bg: "#1a0a2e", accent: "#a855f7", gold: "#e9c97f" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export type AlertSound = "ping" | "adhan";

export interface Settings {
  method: number;
  school: number;
  h12: boolean;
  hijriOffset: number;
  theme: ThemeId;
  alertSound: AlertSound;
}

/* ------------------------------------------------------------------ *
 * Re-exports — keep backward compatibility with existing imports
 * ------------------------------------------------------------------ */

export {
  cleanTime,
  parseHM,
  getZonedParts,
  zonedNowMs,
  zonedPrayerMs,
  formatHM,
  zonedClock,
  PRAYER_ORDER,
  SALAH_ORDER,
  getStatus,
  countdown,
} from "./time";

export type { OrderItem, StatusItem, Countdown } from "./time";

export { adjustedHijri } from "./hijri";
export { qiblaBearing, haversineKm, KAABA } from "./qibla";

export {
  loadLocation,
  saveLocation,
  loadSettings,
  saveSettings,
  loadCachedData,
  saveCachedData,
  loadCacheTime,
  formatCacheAge,
  loadRecents,
  saveRecent,
  clearRecents,
} from "./storage";

/* ------------------------------------------------------------------ *
 * Network helpers
 * ------------------------------------------------------------------ */

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(
    () => controller.abort(new DOMException("Timeout", "TimeoutError")),
    timeoutMs,
  );
  const onExternalAbort = () =>
    controller.abort(
      init?.signal?.reason ?? new DOMException("Aborted", "AbortError"),
    );
  init?.signal?.addEventListener("abort", onExternalAbort, { once: true });
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
    init?.signal?.removeEventListener("abort", onExternalAbort);
  }
}

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init);
      if (res.ok) return res;
      // Don't retry client errors (4xx)
      if (res.status >= 400 && res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 300 * 2 ** attempt));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

/* ------------------------------------------------------------------ *
 * API calls
 * ------------------------------------------------------------------ */

export async function fetchTimings(
  lat: number,
  lon: number,
  method: number,
  school: number,
  date?: Date,
): Promise<PrayerData> {
  let path = "timings";
  if (date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    path = `timings/${dd}-${mm}-${yyyy}`;
  }
  const url =
    `${ALADHAN}/${path}?latitude=${lat}&longitude=${lon}` +
    `&method=${method}&school=${school}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`Prayer service error (${res.status})`);
  const json = await res.json();
  const d = json?.data;
  if (!d?.timings) throw new Error("Unexpected response from prayer service");
  const g = d.date.gregorian;
  const h = d.date.hijri;
  return {
    timings: d.timings,
    readable: d.date.readable,
    hijri: `${h.day} ${h.month.en} ${h.year}`,
    hijriDay: h.day,
    hijriMonthEn: h.month.en,
    hijriMonthAr: h.month.ar,
    hijriYear: h.year,
    hijriWeekday: h.weekday.en,
    gregorian: `${g.day} ${g.month.en} ${g.year}`,
    weekday: g.weekday.en,
    timezone: d.meta.timezone,
    method: d.meta.method.id,
    latitude: d.meta.latitude,
    longitude: d.meta.longitude,
  };
}

export interface MonthDay {
  dayNum: number;
  weekday: string;
  gregorian: string;
  hijri: string;
  timings: Record<string, string>;
}

// In-memory month cache so background prefetch serves MonthPanel instantly.
const monthCache = new Map<string, MonthDay[]>();

function monthKey(
  lat: number,
  lon: number,
  method: number,
  school: number,
  month: number,
  year: number,
) {
  return `${lat.toFixed(3)},${lon.toFixed(3)}/${method}/${school}/${year}-${month}`;
}

export async function fetchMonthTimings(
  lat: number,
  lon: number,
  method: number,
  school: number,
  month: number, // 1-12
  year: number,
  opts?: { signal?: AbortSignal },
): Promise<MonthDay[]> {
  // NOTE: Aladhan's /timingsByMonth endpoint 404s on the live API in every
  // format, so the month is assembled from per-day /timings/DD-MM-YYYY calls
  // (verified working). Fetched with bounded concurrency; each day response
  // is cached 24h by the service-worker runtime cache.
  if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const key = monthKey(lat, lon, method, school, month, year);
  const cached = monthCache.get(key);
  if (cached) return cached;
  const daysInMonth = new Date(year, month, 0).getDate();
  const results: MonthDay[] = new Array(daysInMonth);
  let next = 0;
  // Bounded concurrency: 30 per-day requests share the connection pool with
  // the first-paint API calls — keep it low so month prefetch never starves
  // initial load. (Previously 6; 4 halves connection contention.)
  const CONCURRENCY = 4;
  async function worker(): Promise<void> {
    while (true) {
      if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const i = next++;
      if (i >= daysInMonth) return;
      try {
        const d = await fetchTimings(
          lat,
          lon,
          method,
          school,
          new Date(year, month - 1, i + 1),
        );
        results[i] = {
          dayNum: i + 1,
          weekday: d.weekday,
          gregorian: d.gregorian,
          hijri: d.hijri,
          timings: d.timings,
        };
      } catch (e) {
        if (opts?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
        throw new Error(
          "Couldn't load the monthly timetable. Check your connection.",
          { cause: e },
        );
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, daysInMonth) }, () => worker()),
  );
  monthCache.set(key, results);
  return results;
}

interface NominatimResult {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
}

function shortLabel(addr: Record<string, string>): {
  label: string;
  sublabel?: string;
} {
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.townland ||
    addr.hamlet ||
    addr.municipality ||
    addr.county ||
    addr.state_district;
  const region = addr.state || addr.region;
  const country = addr.country;
  const label = [city, country].filter(Boolean).join(", ");
  const sublabel = region && region !== city ? region : undefined;
  return { label, sublabel };
}

export class SearchError extends Error {
  code: "rate-limit" | "network" | "aborted";
  constructor(message: string, code: SearchError["code"], options?: ErrorOptions) {
    super(message, options);
    this.code = code;
  }
}

export async function searchPlaces(
  query: string,
  opts?: { signal?: AbortSignal },
): Promise<PlaceSuggestion[]> {
  const q = encodeURIComponent(query.trim());
  const url =
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6` +
    `&accept-language=en&q=${q}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(
      url,
      { headers: { Accept: "application/json" }, signal: opts?.signal },
      10000,
    );
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new SearchError("aborted", "aborted");
    }
    throw new SearchError(
      "Couldn't search places. Check your connection and retry.",
      "network",
      { cause: e },
    );
  }
  if (res.status === 429)
    throw new SearchError(
      "Too many searches — please wait a few seconds and try again.",
      "rate-limit",
    );
  if (!res.ok) throw new SearchError("Search failed", "network");
  const arr = (await res.json()) as NominatimResult[];
  return arr.map((r) => {
    const { label, sublabel } = shortLabel(r.address || {});
    const fallback =
      r.display_name?.split(",").slice(0, 2).join(",").trim() || r.name;
    return {
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      label: label || r.name || fallback || "Unknown",
      sublabel,
      raw: r.display_name || "",
    };
  });
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ label: string; sublabel?: string }> {
  const url =
    `${NOMINATIM}/reverse?format=jsonv2&zoom=10` +
    `&accept-language=en&lat=${lat}&lon=${lon}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error("reverse failed");
    const r = (await res.json()) as NominatimResult;
    const { label, sublabel } = shortLabel(r.address || {});
    const fallback = r.display_name?.split(",").slice(0, 2).join(",").trim();
    return { label: label || fallback || "Current location", sublabel };
  } catch {
    return { label: "Current location" };
  }
}

export function getGeolocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    // Single request: allow a stale cached fix (10 min) for instant resolve,
    // but cap the wait at 8s so first paint never hangs on GPS.
    // (Previously two parallel getCurrentPosition calls, one up to 10s —
    // wasted radio + blocked the loading state.)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Search a city instead."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Location unavailable. Search a city instead."
              : "Location request timed out. Search a city instead.";
        reject(new Error(msg));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  });
}
