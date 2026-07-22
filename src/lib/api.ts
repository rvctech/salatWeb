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
  { id: "midnight", name: "Midnight Blue", bg: "#0a0e27", accent: "#60a5fa", gold: "#94a3b8" },
  { id: "desert", name: "Desert Sand", bg: "#f5e6c8", accent: "#c2790a", gold: "#8b6914" },
  { id: "purple", name: "Royal Purple", bg: "#1a0a2e", accent: "#a855f7", gold: "#e9c97f" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export interface Settings {
  method: number;
  school: number;
  h12: boolean;
  hijriOffset: number;
  theme: ThemeId;
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
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
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
): Promise<PrayerData> {
  const url =
    `${ALADHAN}/timings?latitude=${lat}&longitude=${lon}` +
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

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const q = encodeURIComponent(query.trim());
  const url =
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6` +
    `&accept-language=en&q=${q}`;
  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Search failed");
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

    let resolved = false;

    // First try a cached position (instant)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      },
      () => {
        /* ignore — fallback below */
      },
      { enableHighAccuracy: false, timeout: 0, maximumAge: 86400000 },
    );

    // Then request a fresh position in the background
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }
      },
      (err) => {
        if (!resolved) {
          resolved = true;
          const msg =
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied. Search a city instead."
              : err.code === err.POSITION_UNAVAILABLE
                ? "Location unavailable. Search a city instead."
                : "Location request timed out. Search a city instead.";
          reject(new Error(msg));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  });
}
