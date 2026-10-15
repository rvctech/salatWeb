// Ramadan fasting log — one status per local day, on-device only.

import { dayStr } from "./tracker";

export type FastStatus = "kept" | "missed";

const PREFIX = "salat.fast.";

export function loadFast(key = dayStr()): FastStatus | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === "kept" || raw === "missed" ? raw : null;
  } catch {
    return null;
  }
}

export function setFast(key: string, status: FastStatus | null): void {
  try {
    if (status) localStorage.setItem(PREFIX + key, status);
    else localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Gregorian day keys from Ramadan start (inclusive) to Eid (exclusive). */
export function ramadanDayKeys(startISO: string, endISO: string): string[] {
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const keys: string[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    keys.push(dayStr(d));
  }
  return keys;
}
