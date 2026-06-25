import type {
  CalcMethod,
  LocationInfo,
  PlaceSuggestion,
  PrayerData,
} from "./types";

const ALADHAN = "https://api.aladhan.com/v1";
const NOMINATIM = "https://nominatim.openstreetmap.org";

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

/* ------------------------------------------------------------------ *
 * Time helpers (timezone-aware)
 * ------------------------------------------------------------------ */

/** Pull the first HH:MM out of a string like "05:21" or "05:21 (EST)". */
export function cleanTime(t: string): string {
  const m = t.match(/\d{1,2}:\d{2}/);
  return m ? m[0] : t;
}

export function parseHM(t: string): { h: number; m: number } {
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (!m) return { h: 0, m: 0 };
  return { h: parseInt(m[1], 10) % 24, m: parseInt(m[2], 10) };
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Wall-clock parts of an instant, expressed in the given IANA timezone. */
export function getZonedParts(tz: string, d = new Date()): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz || undefined,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  let hour = parseInt(g("hour"), 10);
  if (hour === 24) hour = 0;
  return {
    year: parseInt(g("year"), 10),
    month: parseInt(g("month"), 10),
    day: parseInt(g("day"), 10),
    hour,
    minute: parseInt(g("minute"), 10),
    second: parseInt(g("second"), 10),
  };
}

/** A comparable ms timestamp for "now" in the target timezone. */
export function zonedNowMs(tz: string, epoch = Date.now()): number {
  const p = getZonedParts(tz, new Date(epoch));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** ms timestamp for a wall-clock prayer time (with optional day offset). */
export function zonedPrayerMs(
  tz: string,
  h: number,
  m: number,
  dayOffset = 0,
): number {
  const p = getZonedParts(tz);
  return Date.UTC(p.year, p.month - 1, p.day + dayOffset, h % 24, m, 0);
}

export function formatHM(h: number, m: number, h12: boolean): string {
  const mm = String(m).padStart(2, "0");
  if (h12) {
    const period = h >= 12 ? "PM" : "AM";
    let hr = h % 12;
    if (hr === 0) hr = 12;
    return `${hr}:${mm}\u00A0${period}`;
  }
  return `${String(h).padStart(2, "0")}:${mm}`;
}

export function zonedClock(
  tz: string,
  epoch = Date.now(),
  h12: boolean,
  withSeconds = true,
): string {
  const p = getZonedParts(tz, new Date(epoch));
  const mm = String(p.minute).padStart(2, "0");
  const ss = withSeconds ? `:${String(p.second).padStart(2, "0")}` : "";
  if (h12) {
    const period = p.hour >= 12 ? "PM" : "AM";
    let hr = p.hour % 12;
    if (hr === 0) hr = 12;
    return `${hr}:${mm}${ss}\u00A0${period}`;
  }
  return `${String(p.hour).padStart(2, "0")}:${mm}${ss}`;
}

/* ------------------------------------------------------------------ *
 * Prayer ordering / status
 * ------------------------------------------------------------------ */

export interface OrderItem {
  key: string;
  name: string;
  arabic: string;
}

export const PRAYER_ORDER: OrderItem[] = [
  { key: "Fajr", name: "Fajr", arabic: "الفجر" },
  { key: "Sunrise", name: "Sunrise", arabic: "الشروق" },
  { key: "Dhuhr", name: "Dhuhr", arabic: "الظهر" },
  { key: "Asr", name: "Asr", arabic: "العصر" },
  { key: "Maghrib", name: "Maghrib", arabic: "المغرب" },
  { key: "Isha", name: "Isha", arabic: "العشاء" },
];

export const SALAH_ORDER: OrderItem[] = PRAYER_ORDER.filter(
  (p) => p.key !== "Sunrise",
);

export interface StatusItem extends OrderItem {
  h: number;
  m: number;
  ms: number;
  dayOffset: number;
}

/** Returns the previous & next item in the daily cycle of `order`. */
export function getStatus(
  order: OrderItem[],
  timings: Record<string, string>,
  tz: string,
  nowMs: number,
): { next: StatusItem; prev: StatusItem } {
  const def = (key: string, off: number): StatusItem => {
    const base = order.find((o) => o.key === key)!;
    const { h, m } = parseHM(timings[key] ?? "00:00");
    return { ...base, h, m, ms: zonedPrayerMs(tz, h, m, off), dayOffset: off };
  };

  const first = order[0].key;
  const last = order[order.length - 1].key;
  const timeline: StatusItem[] = [
    def(last, -1),
    ...order.map((o) => def(o.key, 0)),
    def(first, 1),
  ];

  let i = 0;
  while (i < timeline.length && timeline[i].ms <= nowMs) i++;
  const next = timeline[Math.min(i, timeline.length - 1)];
  const prev = timeline[Math.max(i - 1, 0)];
  return { next, prev };
}

export interface Countdown {
  h: number;
  m: number;
  s: number;
}

export function countdown(ms: number): Countdown {
  let t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  t -= h * 3600;
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return { h, m, s };
}

/* ------------------------------------------------------------------ *
 * Hijri date adjustment
 * ------------------------------------------------------------------ */

const HIJRI_MONTH_DAYS = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
const HIJRI_MONTH_NAMES = [
  "Muharram", "Safar", "Rabi' I", "Rabi' II",
  "Jumada I", "Jumada II", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu'l-Qi'dah", "Dhu'l-Hijjah",
];

function isHijriLeapYear(year: number): boolean {
  const leaps = new Set([2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]);
  return leaps.has(year % 30);
}

function hijriMonthLength(month: number, year: number): number {
  if (month === 12) return isHijriLeapYear(year) ? 30 : 29;
  return HIJRI_MONTH_DAYS[month - 1];
}

function hijriToDays(day: number, month: number, year: number): number {
  const CYCLE_DAYS = 19 * 354 + 11 * 355;
  const cycles = Math.floor((year - 1) / 30);
  let days = cycles * CYCLE_DAYS;
  for (let y = 1; y <= (year - 1) % 30; y++) {
    days += isHijriLeapYear(y) ? 355 : 354;
  }
  for (let m = 1; m < month; m++) days += hijriMonthLength(m, year);
  return days + day;
}

function daysToHijri(total: number): { day: number; month: number; year: number } {
  let year = 1;
  while (true) {
    const yrDays = isHijriLeapYear(year) ? 355 : 354;
    if (total <= yrDays) break;
    total -= yrDays;
    year++;
  }
  let month = 1;
  while (true) {
    const mDays = hijriMonthLength(month, year);
    if (total <= mDays) break;
    total -= mDays;
    month++;
  }
  return { day: total, month, year };
}

export function adjustedHijri(
  dayStr: string,
  monthEn: string,
  yearStr: string,
  offset: number,
): string {
  if (offset === 0) return `${dayStr} ${monthEn} ${yearStr}`;
  const day = parseInt(dayStr, 10) || 1;
  const year = parseInt(yearStr, 10) || 1446;
  const monthIdx = HIJRI_MONTH_NAMES.indexOf(monthEn) + 1;
  const month = monthIdx > 0 ? monthIdx : 1;
  const total = hijriToDays(day, month, year) + offset;
  if (total < 1) return "1 Muharram 1";
  const adj = daysToHijri(total);
  return `${adj.day} ${HIJRI_MONTH_NAMES[adj.month - 1]} ${adj.year}`;
}

/* ------------------------------------------------------------------ *
 * Qibla
 * ------------------------------------------------------------------ */

export const KAABA = { lat: 21.4225, lon: 39.8262 };

/** Initial bearing (degrees, clockwise from North) toward the Kaaba. */
export function qiblaBearing(lat: number, lon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLon = toRad(KAABA.lon - lon);
  const lat1 = toRad(lat);
  const lat2 = toRad(KAABA.lat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/* ------------------------------------------------------------------ *
 * Network
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
  const res = await fetch(url);
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
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Search failed");
  const arr = (await res.json()) as any[];
  return arr.map((r) => {
    const { label, sublabel } = shortLabel(r.address || {});
    const fallback =
      r.display_name?.split(",").slice(0, 2).join(",").trim() || r.name;
    return {
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      label: label || r.name || fallback,
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
    const res = await fetch(url);
    if (!res.ok) throw new Error("reverse failed");
    const r = await res.json();
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

/** Load + persist a single location summary in localStorage. */
const LOC_KEY = "salat.location";
const SET_KEY = "salat.settings";
const CACHE_KEY = "salat.cache";

export function loadLocation(): LocationInfo | null {
  try {
    const raw = localStorage.getItem(LOC_KEY);
    return raw ? (JSON.parse(raw) as LocationInfo) : null;
  } catch {
    return null;
  }
}

export function saveLocation(loc: LocationInfo) {
  try {
    localStorage.setItem(LOC_KEY, JSON.stringify(loc));
  } catch {
    /* ignore */
  }
}

export interface Settings {
  method: number;
  school: number;
  h12: boolean;
  hijriOffset: number;
}

export function loadSettings(): Settings {
  const fallback: Settings = {
    method: DEFAULT_METHOD,
    school: 0,
    h12: true,
    hijriOffset: 0,
  };
  try {
    const raw = localStorage.getItem(SET_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SET_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function loadCachedData(): PrayerData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as PrayerData) : null;
  } catch {
    return null;
  }
}

export function saveCachedData(d: PrayerData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}
