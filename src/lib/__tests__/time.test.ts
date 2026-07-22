import { describe, it, expect } from "vitest";
import { parseHM, cleanTime, formatHM, getStatus, countdown, getZonedParts, zonedPrayerMs, PRAYER_ORDER, SALAH_ORDER } from "../time";

describe("parseHM", () => {
  it("parses HH:MM", () => {
    expect(parseHM("05:21")).toEqual({ h: 5, m: 21 });
  });
  it("parses with timezone suffix", () => {
    expect(parseHM("13:45 (EST)")).toEqual({ h: 13, m: 45 });
  });
  it("returns 0:00 for invalid", () => {
    expect(parseHM("invalid")).toEqual({ h: 0, m: 0 });
  });
  it("wraps hour 24 to 0", () => {
    expect(parseHM("24:00")).toEqual({ h: 0, m: 0 });
  });
});

describe("cleanTime", () => {
  it("extracts HH:MM", () => {
    expect(cleanTime("05:21 (EST)")).toBe("05:21");
  });
  it("returns as-is if already clean", () => {
    expect(cleanTime("12:00")).toBe("12:00");
  });
});

describe("formatHM", () => {
  it("formats 12h", () => {
    expect(formatHM(14, 5, true)).toBe("2:05\u00A0PM");
  });
  it("formats 12h midnight", () => {
    expect(formatHM(0, 30, true)).toBe("12:30\u00A0AM");
  });
  it("formats 12h noon", () => {
    expect(formatHM(12, 0, true)).toBe("12:00\u00A0PM");
  });
  it("formats 24h", () => {
    expect(formatHM(14, 5, false)).toBe("14:05");
  });
  it("pads minutes", () => {
    expect(formatHM(9, 0, false)).toBe("09:00");
  });
});

describe("countdown", () => {
  it("converts ms to h:m:s", () => {
    expect(countdown(3661000)).toEqual({ h: 1, m: 1, s: 1 });
  });
  it("floors to 0 for negative", () => {
    expect(countdown(-5000)).toEqual({ h: 0, m: 0, s: 0 });
  });
  it("handles zero", () => {
    expect(countdown(0)).toEqual({ h: 0, m: 0, s: 0 });
  });
  it("handles large values", () => {
    expect(countdown(86400000)).toEqual({ h: 24, m: 0, s: 0 });
  });
});

describe("getZonedParts", () => {
  it("returns valid parts for UTC", () => {
    const p = getZonedParts("UTC", new Date(Date.UTC(2025, 0, 15, 10, 30, 45)));
    expect(p.year).toBe(2025);
    expect(p.month).toBe(1);
    expect(p.day).toBe(15);
    expect(p.hour).toBe(10);
    expect(p.minute).toBe(30);
    expect(p.second).toBe(45);
  });

  it("handles hour 24 -> 0", () => {
    // This can happen with some timezones at midnight
    const p = getZonedParts("UTC", new Date(Date.UTC(2025, 0, 15, 24, 0, 0)));
    expect(p.hour).toBe(0);
  });
});

describe("zonedPrayerMs", () => {
  it("returns a numeric timestamp", () => {
    const ms = zonedPrayerMs("UTC", 12, 0);
    expect(typeof ms).toBe("number");
    expect(Number.isFinite(ms)).toBe(true);
  });

  it("applies day offset", () => {
    const today = zonedPrayerMs("UTC", 12, 0, 0);
    const tomorrow = zonedPrayerMs("UTC", 12, 0, 1);
    expect(tomorrow - today).toBe(86400000);
  });
});

describe("getStatus", () => {
  const timings = {
    Fajr: "05:00",
    Sunrise: "06:30",
    Dhuhr: "12:15",
    Asr: "15:45",
    Maghrib: "18:30",
    Isha: "20:00",
  };
  const tz = "UTC";

  function msAt(h: number, m: number): number {
    const p = getZonedParts(tz);
    return Date.UTC(p.year, p.month - 1, p.day, h, m, 0);
  }

  it("returns Fajr as next when before Fajr", () => {
    const nowMs = msAt(3, 0);
    const { next } = getStatus(SALAH_ORDER, timings, tz, nowMs);
    expect(next.key).toBe("Fajr");
    expect(next.dayOffset).toBe(0);
  });

  it("returns Dhuhr as next when between Sunrise and Dhuhr", () => {
    const nowMs = msAt(10, 0);
    const { next } = getStatus(SALAH_ORDER, timings, tz, nowMs);
    expect(next.key).toBe("Dhuhr");
  });

  it("returns Isha as next when between Maghrib and Isha", () => {
    const nowMs = msAt(19, 0);
    const { next } = getStatus(SALAH_ORDER, timings, tz, nowMs);
    expect(next.key).toBe("Isha");
  });

  it("returns Fajr+1 as next when after Isha", () => {
    const nowMs = msAt(21, 0);
    const { next, prev } = getStatus(SALAH_ORDER, timings, tz, nowMs);
    expect(next.key).toBe("Fajr");
    expect(next.dayOffset).toBe(1);
    expect(prev.key).toBe("Isha");
  });

  it("prev is the last prayer before now", () => {
    const nowMs = msAt(16, 0);
    const { prev } = getStatus(SALAH_ORDER, timings, tz, nowMs);
    expect(prev.key).toBe("Asr");
  });
});

describe("PRAYER_ORDER", () => {
  it("has 6 entries", () => {
    expect(PRAYER_ORDER).toHaveLength(6);
  });
  it("starts with Fajr", () => {
    expect(PRAYER_ORDER[0].key).toBe("Fajr");
  });
  it("ends with Isha", () => {
    expect(PRAYER_ORDER[5].key).toBe("Isha");
  });
  it("includes Sunrise", () => {
    expect(PRAYER_ORDER.find((p) => p.key === "Sunrise")).toBeDefined();
  });
});

describe("SALAH_ORDER", () => {
  it("excludes Sunrise", () => {
    expect(SALAH_ORDER.find((p) => p.key === "Sunrise")).toBeUndefined();
  });
  it("has 5 entries", () => {
    expect(SALAH_ORDER).toHaveLength(5);
  });
});
