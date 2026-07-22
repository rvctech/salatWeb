import type { LocationInfo, PrayerData } from "./types";
import type { Settings } from "./api";

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

export function loadSettings(): Settings {
  const fallback: Settings = {
    method: 3,
    school: 0,
    h12: true,
    hijriOffset: 0,
    theme: "default",
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
