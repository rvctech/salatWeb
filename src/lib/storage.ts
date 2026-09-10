import type { LocationInfo, PrayerData } from "./types";
import type { Settings } from "./api";

const LOC_KEY = "salat.location";
const SET_KEY = "salat.settings";
const CACHE_KEY = "salat.cache";
const CACHE_TIME_KEY = "salat.cache.time";
const RECENT_KEY = "salat.recents";
const MAX_RECENTS = 6;

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

const VALID_THEMES = ["default", "light", "midnight", "desert", "purple"] as const;

export function loadSettings(): Settings {
  const fallback: Settings = {
    method: 3,
    school: 0,
    h12: true,
    hijriOffset: 0,
    theme: "default",
    alertSound: "ping",
  };
  try {
    const raw = localStorage.getItem(SET_KEY);
    if (!raw) return fallback;
    const merged = { ...fallback, ...JSON.parse(raw) };
    // Guard against stale/unknown values from older builds.
    if (!(VALID_THEMES as readonly string[]).includes(merged.theme)) {
      merged.theme = fallback.theme;
    }
    if (merged.alertSound !== "ping" && merged.alertSound !== "adhan") {
      merged.alertSound = fallback.alertSound;
    }
    return merged;
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
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function loadCacheTime(): number | null {
  try {
    const raw = localStorage.getItem(CACHE_TIME_KEY);
    const t = raw ? Number(raw) : NaN;
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

export function formatCacheAge(cachedAt: number | null, now = Date.now()): string {
  if (cachedAt == null) return "cached";
  const diff = Math.max(0, now - cachedAt);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(cachedAt).toLocaleDateString();
}

export function loadRecents(): LocationInfo[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? (JSON.parse(raw) as LocationInfo[]) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

export function saveRecent(loc: LocationInfo) {
  try {
    const cur = loadRecents().filter(
      (r) =>
        Math.abs(r.lat - loc.lat) > 0.01 || Math.abs(r.lon - loc.lon) > 0.01,
    );
    const next = [loc, ...cur].slice(0, MAX_RECENTS);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecents() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    /* ignore */
  }
}
