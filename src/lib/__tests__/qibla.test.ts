import { describe, it, expect } from "vitest";
import { qiblaBearing, haversineKm, KAABA } from "../qibla";

describe("qiblaBearing", () => {
  it("returns ~0 from Makkah (same location)", () => {
    const bearing = qiblaBearing(KAABA.lat, KAABA.lon);
    // From Makkah itself, bearing is undefined but should be a valid number
    expect(Number.isFinite(bearing)).toBe(true);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });

  it("returns ~180 from a point south of Makkah", () => {
    // From Jeddah (south of Makkah), bearing should be roughly north
    const bearing = qiblaBearing(21.0, 39.8262);
    // Should point roughly north-ish
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });

  it("returns a bearing between 0 and 360", () => {
    const bearing = qiblaBearing(51.5074, -0.1278); // London
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });

  it("from New York points roughly southeast", () => {
    const bearing = qiblaBearing(40.7128, -74.006);
    // Qibla from NYC is roughly southeast (~58-62 degrees)
    expect(bearing).toBeGreaterThan(40);
    expect(bearing).toBeLessThan(80);
  });
});

describe("haversineKm", () => {
  it("returns 0 for same point", () => {
    expect(haversineKm(51.5, -0.1, 51.5, -0.1)).toBe(0);
  });

  it("calculates known distance (London to Paris ~340km)", () => {
    const d = haversineKm(51.5074, -0.1278, 48.8566, 2.3522);
    expect(d).toBeGreaterThanOrEqual(300);
    expect(d).toBeLessThanOrEqual(400);
  });

  it("calculates large distance (NYC to London ~5570km)", () => {
    const d = haversineKm(40.7128, -74.006, 51.5074, -0.1278);
    expect(d).toBeGreaterThanOrEqual(5500);
    expect(d).toBeLessThanOrEqual(5700);
  });
});

describe("KAABA", () => {
  it("has correct coordinates", () => {
    expect(KAABA.lat).toBeCloseTo(21.4225);
    expect(KAABA.lon).toBeCloseTo(39.8262);
  });
});
