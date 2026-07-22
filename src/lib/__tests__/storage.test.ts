import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadSettings, saveSettings } from "../storage";

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
    const settings = { method: 2, school: 1, h12: false, hijriOffset: 1, theme: "purple" as const };
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
    const base = { method: 8, school: 0, h12: true, hijriOffset: -2, theme: "default" as const };
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
      saveSettings({ method: 3, school: 0, h12: true, hijriOffset: 0, theme: t });
      expect(loadSettings().theme).toBe(t);
    }
  });
});
