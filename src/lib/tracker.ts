// Prayer tracker — daily check-offs persisted in localStorage.
// No account, no network: one key per local day.

export const TRACKED_PRAYERS = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
] as const;

export type TrackedPrayer = (typeof TRACKED_PRAYERS)[number];

export type DayRecord = Record<TrackedPrayer, boolean>;

const PREFIX = "salat.track.";

export function dayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDay(base: Date, delta: number): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + delta);
  return dayStr(d);
}

const EMPTY: DayRecord = {
  Fajr: false,
  Dhuhr: false,
  Asr: false,
  Maghrib: false,
  Isha: false,
};

export function loadDay(key = dayStr()): DayRecord {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<DayRecord>;
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

export function saveDay(key: string, record: DayRecord): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(record));
  } catch {
    /* ignore */
  }
}

export function togglePrayer(key: string, prayer: TrackedPrayer): DayRecord {
  const next = { ...loadDay(key), [prayer]: !loadDay(key)[prayer] };
  saveDay(key, next);
  return next;
}

export function dayCount(record: DayRecord): number {
  return TRACKED_PRAYERS.filter((p) => record[p]).length;
}

export function isComplete(record: DayRecord): boolean {
  return TRACKED_PRAYERS.every((p) => record[p]);
}

export interface WeekDay {
  key: string;
  label: string;
  done: number;
  complete: boolean;
  isToday: boolean;
}

/** Last 7 days ending today, for the week strip. */
export function loadWeek(now = new Date()): WeekDay[] {
  const today = dayStr(now);
  return Array.from({ length: 7 }, (_, i) => {
    const key = shiftDay(now, i - 6);
    const record = loadDay(key);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (i - 6));
    return {
      key,
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      done: dayCount(record),
      complete: isComplete(record),
      isToday: key === today,
    };
  });
}

/** Consecutive complete days. If today isn't complete yet, streak counts from yesterday. */
export function currentStreak(now = new Date()): number {
  let streak = 0;
  let offset = isComplete(loadDay(dayStr(now))) ? 0 : -1;
  for (;;) {
    const record = loadDay(shiftDay(now, offset));
    if (!isComplete(record)) break;
    streak++;
    offset--;
    if (streak > 3650) break; // sanity cap
  }
  return streak;
}
