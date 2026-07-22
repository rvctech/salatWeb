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
