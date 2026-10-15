// Upcoming Islamic occasions — Umm al-Qura / calculated dates bundled
// offline so the countdown works without network. Actual observance follows
// local moon sighting and may shift ±1 day.

export interface IslamicEvent {
  key: "ramadan" | "fitr" | "arafah" | "adha";
  label: string;
  arabic: string;
  /** Gregorian date ISO (YYYY-MM-DD). */
  date: string;
}

const EVENTS: IslamicEvent[] = [
  { key: "ramadan", label: "Ramadan begins", arabic: "رَمَضَان", date: "2026-02-18" },
  { key: "fitr", label: "Eid al-Fitr", arabic: "عِيد ٱلْفِطْر", date: "2026-03-20" },
  { key: "arafah", label: "Day of Arafah", arabic: "يَوْم عَرَفَة", date: "2026-05-26" },
  { key: "adha", label: "Eid al-Adha", arabic: "عِيد ٱلْأَضْحَىٰ", date: "2026-05-27" },
  { key: "ramadan", label: "Ramadan begins", arabic: "رَمَضَان", date: "2027-02-08" },
  { key: "fitr", label: "Eid al-Fitr", arabic: "عِيد ٱلْفِطْر", date: "2027-03-09" },
  { key: "arafah", label: "Day of Arafah", arabic: "يَوْم عَرَفَة", date: "2027-05-16" },
  { key: "adha", label: "Eid al-Adha", arabic: "عِيد ٱلْأَضْحَىٰ", date: "2027-05-17" },
  { key: "ramadan", label: "Ramadan begins", arabic: "رَمَضَان", date: "2028-01-28" },
  { key: "fitr", label: "Eid al-Fitr", arabic: "عِيد ٱلْفِطْر", date: "2028-02-26" },
  { key: "arafah", label: "Day of Arafah", arabic: "يَوْم عَرَفَة", date: "2028-05-04" },
  { key: "adha", label: "Eid al-Adha", arabic: "عِيد ٱلْأَضْحَىٰ", date: "2028-05-05" },
  { key: "ramadan", label: "Ramadan begins", arabic: "رَمَضَان", date: "2029-01-16" },
  { key: "fitr", label: "Eid al-Fitr", arabic: "عِيد ٱلْفِطْر", date: "2029-02-14" },
  { key: "arafah", label: "Day of Arafah", arabic: "يَوْم عَرَفَة", date: "2029-04-23" },
  { key: "adha", label: "Eid al-Adha", arabic: "عِيد ٱلْأَضْحَىٰ", date: "2029-04-24" },
  { key: "ramadan", label: "Ramadan begins", arabic: "رَمَضَان", date: "2030-01-06" },
  { key: "fitr", label: "Eid al-Fitr", arabic: "عِيد ٱلْفِطْر", date: "2030-02-04" },
  { key: "arafah", label: "Day of Arafah", arabic: "يَوْم عَرَفَة", date: "2030-04-13" },
  { key: "adha", label: "Eid al-Adha", arabic: "عِيد ٱلْأَضْحَىٰ", date: "2030-04-14" },
  { key: "ramadan", label: "Ramadan begins", arabic: "رَمَضَان", date: "2030-12-26" },
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface NextIslamicEvent {
  event: IslamicEvent;
  daysLeft: number;
  isToday: boolean;
}

export function getNextIslamicEvent(now = new Date()): NextIslamicEvent | null {
  const today = startOfDay(now).getTime();
  for (const event of EVENTS) {
    const [y, m, d] = event.date.split("-").map(Number);
    const t = new Date(y, m - 1, d).getTime();
    const daysLeft = Math.round((t - today) / 86400000);
    if (daysLeft >= 0) return { event, daysLeft, isToday: daysLeft === 0 };
  }
  return null;
}

export function formatEventDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface RamadanRange {
  /** ISO date of 1 Ramadan. */
  startISO: string;
  /** ISO date of 1 Shawwal (Eid al-Fitr) — fasting days are start..end. */
  endISO: string;
}

function isoToDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** The Ramadan fast range containing today, or null outside Ramadan. */
export function getRamadanRange(now = new Date()): RamadanRange | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (let i = 0; i < EVENTS.length; i++) {
    if (EVENTS[i].key !== "ramadan") continue;
    const fitr = EVENTS.slice(i + 1).find((e) => e.key === "fitr");
    if (!fitr) continue;
    const start = isoToDay(EVENTS[i].date);
    const end = isoToDay(fitr.date);
    if (today >= start && today < end) {
      return { startISO: EVENTS[i].date, endISO: fitr.date };
    }
  }
  return null;
}

/** 1-based day of Ramadan for today (null outside Ramadan). */
export function ramadanDayNumber(range: RamadanRange, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((today - isoToDay(range.startISO)) / 86400000) + 1;
}
