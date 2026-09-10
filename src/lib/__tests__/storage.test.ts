import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadSettings,
  saveSettings,
  loadRecents,
  saveRecent,
  clearRecents,
  saveCachedData,
  loadCacheTime,
  formatCacheAge,
} from "../storage";

function makeLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = v;
    }),
    removeItem: vi.fn((k: string) => {
      delete store[k];
    }),
    clear: vi.fn(() => {
      for (const k of Object.keys(store)) delete store[k];
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
}

describe("settings theme persistence", () => {
  let ls: ReturnType<typeof makeLocalStorage>;

  beforeEach(() => {
    ls = makeLocalStorage();
    vi.stubGlobal("localStorage", ls);
  });

  it("defaults to theme 'default' when nothing stored", () => {
    expect(loadSettings().theme).toBe("default");
  });

  it("round-trips theme through save → load", () => {
    const settings = { method: 2, school: 1, h12: false, hijriOffset: 1, theme: "purple" as const, alertSound: "adhan" as const };
    saveSettings(settings);
    expect(ls.setItem).toHaveBeenCalled();

    const loaded = loadSettings();
    expect(loaded.theme).toBe("purple");
    expect(loaded.method).toBe(2);
    expect(loaded.school).toBe(1);
    expect(loaded.h12).toBe(false);
    expect(loaded.hijriOffset).toBe(1);
  });

  it("preserves other settings when only theme changes", () => {
    const base = { method: 8, school: 0, h12: true, hijriOffset: -2, theme: "default" as const, alertSound: "ping" as const };
    saveSettings(base);

    const updated = { ...base, theme: "light" as const };
    saveSettings(updated);
    const loaded = loadSettings();
    expect(loaded.theme).toBe("light");
    expect(loaded.method).toBe(8);
    expect(loaded.hijriOffset).toBe(-2);
  });

  it("handles all valid theme ids", () => {
    const themes = ["default", "light", "midnight", "desert", "purple"] as const;
    for (const t of themes) {
      saveSettings({ method: 3, school: 0, h12: true, hijriOffset: 0, theme: t, alertSound: "ping" as const });
      expect(loadSettings().theme).toBe(t);
    }
  });
});

  it("defaults alertSound to ping and rejects unknown values", () => {
    saveSettings({ method: 3, school: 0, h12: true, hijriOffset: 0, theme: "default" as const, alertSound: "ping" as const });
    expect(loadSettings().alertSound).toBe("ping");
    saveSettings({ method: 3, school: 0, h12: true, hijriOffset: 0, theme: "default" as const, alertSound: "adhan" as const });
    expect(loadSettings().alertSound).toBe("adhan");
  });

describe("recents", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorage());
  });

  const loc = (label: string, lat: number, lon: number) => ({
    label,
    lat,
    lon,
    source: "search" as const,
  });

  it("starts empty", () => {
    expect(loadRecents()).toEqual([]);
  });

  it("prepends and dedupes nearby locations", () => {
    saveRecent(loc("Cairo", 30.04, 31.23));
    saveRecent(loc("Cairo dup", 30.045, 31.235));
    const recents = loadRecents();
    expect(recents).toHaveLength(1);
    expect(recents[0].label).toBe("Cairo dup");
  });

  it("caps at 6 and clears", () => {
    for (let i = 0; i < 8; i++) saveRecent(loc(`City ${i}`, i, i * 2));
    expect(loadRecents()).toHaveLength(6);
    expect(loadRecents()[0].label).toBe("City 7");
    clearRecents();
    expect(loadRecents()).toEqual([]);
  });
});

describe("cache age", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeLocalStorage());
  });

  it("returns null with no cache, then a timestamp after save", () => {
    expect(loadCacheTime()).toBeNull();
    saveCachedData({
      timings: {},
      readable: "",
      hijri: "",
      hijriDay: "",
      hijriMonthEn: "",
      hijriMonthAr: "",
      hijriYear: "",
      hijriWeekday: "",
      gregorian: "",
      weekday: "",
      timezone: "",
      method: 3,
      latitude: 0,
      longitude: 0,
    });
    expect(loadCacheTime()).toBeTypeOf("number");
  });

  it("formats ages", () => {
    const now = Date.now();
    expect(formatCacheAge(now, now)).toBe("just now");
    expect(formatCacheAge(now - 5 * 60000, now)).toBe("5m ago");
    expect(formatCacheAge(now - 3 * 3600000, now)).toBe("3h ago");
    expect(formatCacheAge(now - 30 * 3600000, now)).toBe("yesterday");
    expect(formatCacheAge(null, now)).toBe("cached");
  });
});
