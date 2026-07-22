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
