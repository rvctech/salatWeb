import { describe, it, expect } from "vitest";
import { adjustedHijri } from "../hijri";

describe("adjustedHijri", () => {
  it("returns unchanged when offset is 0", () => {
    expect(adjustedHijri("15", "Ramadan", "1446", 0)).toBe("15 Ramadan 1446");
  });

  it("adds days within same month", () => {
    const result = adjustedHijri("10", "Ramadan", "1446", 3);
    expect(result).toBe("13 Ramadan 1446");
  });

  it("subtracts days within same month", () => {
    const result = adjustedHijri("10", "Ramadan", "1446", -3);
    expect(result).toBe("7 Ramadan 1446");
  });

  it("crosses month boundary forward", () => {
    // Ramadan in 1446 is 30 days; day 29 + 2 = day 1 of Shawwal
    const result = adjustedHijri("29", "Ramadan", "1446", 2);
    expect(result).toContain("Shawwal");
  });

  it("crosses month boundary backward", () => {
    // Day 2 of a month - 3 days = day 29 of previous month
    const result = adjustedHijri("2", "Safar", "1447", -3);
    expect(result).toContain("Muharram");
  });

  it("handles offset of +5", () => {
    const result = adjustedHijri("10", "Sha'ban", "1447", 5);
    expect(result).toContain("1447");
  });

  it("handles offset of -5", () => {
    const result = adjustedHijri("10", "Sha'ban", "1447", -5);
    expect(result).toContain("1447");
  });

  it("returns previous month for -1 day from month start", () => {
    const result = adjustedHijri("1", "Muharram", "1446", -1);
    expect(result).toContain("Dhu'l-Hijjah");
    expect(result).toContain("1445");
  });
});
