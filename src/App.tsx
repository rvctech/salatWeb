import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import Background from "./components/Background";
import { LogoIcon, GearIcon, SearchIcon, LocateIcon } from "./components/Icons";
import {
  fetchTimings,
  fetchMonthTimings,
  getGeolocation,
  reverseGeocode,
  loadLocation,
  saveLocation,
  loadSettings,
  saveSettings,
  loadCachedData,
  saveCachedData,
  type Settings,
} from "./lib/api";
import type { LocationInfo, PrayerData } from "./lib/types";

import Results from "./components/Results";
import Welcome from "./components/Welcome";
import ErrorView from "./components/ErrorView";
import Toast from "./components/Toast";

const SearchPanel = lazy(() => import("./components/SearchPanel"));
const SettingsPanel = lazy(() => import("./components/SettingsPanel"));

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [location, setLocation] = useState<LocationInfo | null>(() =>
    loadLocation(),
  );
  const [data, setData] = useState<PrayerData | null>(() => loadCachedData());
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [panel, setPanel] = useState<"search" | "settings" | null>(null);
  const [locating, setLocating] = useState(false);
  const [tomorrow, setTomorrow] = useState<PrayerData | null>(null);

  const settingsRef = useRef(settings);
  const didInit = useRef(false);
  const skipSettings = useRef(true);
  const fetchIdRef = useRef(0);

  // Keep ref in sync via effect to avoid writing during render
  useEffect(() => {
    settingsRef.current = settings;
  });

  const loadFor = useCallback(async (loc: LocationInfo, s: Settings) => {
    const id = ++fetchIdRef.current;
    setStatus("loading");
    setError(null);
    try {
      const d = await fetchTimings(loc.lat, loc.lon, s.method, s.school);
      // Ignore stale responses
      if (id !== fetchIdRef.current) return;
      setData(d);
      saveCachedData(d);
      setLocation(loc);
      saveLocation(loc);
      setStatus("idle");
    } catch (e) {
      if (id !== fetchIdRef.current) return;
      setError(
        e instanceof Error ? e.message : "Failed to load prayer times.",
      );
      setStatus("error");
    }
  }, []);

  const locate = useCallback(
    async (silent = false) => {
      setLocating(true);
      setError(null);
      try {
        const { lat, lon } = await getGeolocation();
        const rev = await reverseGeocode(lat, lon);
        const loc: LocationInfo = {
          lat,
          lon,
          label: rev.label,
          sublabel: rev.sublabel,
          source: "geo",
        };
        await loadFor(loc, settingsRef.current);
        setToast(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to get location.";
        if (silent) {
          setToast(msg);
          setStatus("idle");
        } else {
          setError(msg);
          setStatus("error");
        }
      } finally {
        setLocating(false);
      }
    },
    [loadFor],
  );

  // On mount: restore saved location or attempt auto-detect once.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const saved = loadLocation();
    if (saved) {
      // location already restored from localStorage in useState
      loadFor(saved, settingsRef.current);
    } else {
      locate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist settings.
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Apply theme to document + sync PWA theme-color.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-body-bg")
      .trim();
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    if (bg) meta.setAttribute("content", bg.split(" ")[0]);
  }, [settings.theme]);

  // Re-fetch when the calculation method / school changes.
  useEffect(() => {
    if (skipSettings.current) {
      skipSettings.current = false;
      return;
    }
    if (location) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadFor(location, settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.method, settings.school]);

  // Silently prefetch tomorrow's timetable for the Day tabs.
  useEffect(() => {
    if (!location) return;
    const s = settingsRef.current;
    const tmr = new Date(Date.now() + 86400000);
    let cancelled = false;
    fetchTimings(location.lat, location.lon, s.method, s.school, tmr)
      .then((d) => {
        if (!cancelled) setTomorrow(d);
      })
      .catch(() => {
        /* tomorrow tab falls back to today's list */
      });
    return () => {
      cancelled = true;
    };
  }, [location, settings.method, settings.school, data]);

  // Silently prefetch the current month on idle so Month view opens instantly.
  useEffect(() => {
    if (!location || !data) return;
    const s = settingsRef.current;
    const now = new Date();
    const controller = new AbortController();
    const run = () => {
      fetchMonthTimings(
        location.lat,
        location.lon,
        s.method,
        s.school,
        now.getMonth() + 1,
        now.getFullYear(),
        { signal: controller.signal },
      ).catch(() => {
        /* month view fetches on open instead */
      });
    };
    if (
      typeof requestIdleCallback !== "undefined" &&
      typeof cancelIdleCallback !== "undefined"
    ) {
      const id = requestIdleCallback(run);
      return () => {
        controller.abort();
        cancelIdleCallback(id);
      };
    }
    const id = setTimeout(run, 4000);
    return () => {
      controller.abort();
      clearTimeout(id);
    };
  }, [location, settings.method, settings.school, data]);

  const selectPlace = useCallback(
    (loc: LocationInfo) => {
      setPanel(null);
      loadFor(loc, settingsRef.current);
    },
    [loadFor],
  );
  const openLocate = useCallback(() => {
    setPanel(null);
    locate(false);
  }, [locate]);

  const hasData = Boolean(data && location);
  const firstLoad = status === "loading" && !data;
  const busy = locating || firstLoad;

  return (
    <>
      <Background />

      {status === "loading" && (
        <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-gold/10">
          <div className="topbar-fill h-full w-1/4 rounded-full bg-linear-to-r from-transparent via-gold to-transparent" />
        </div>
      )}

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-4 sm:px-6 sm:py-10">
        {/* Bismillah banner */}
        <div className="animate-fadeIn mb-4 flex items-center justify-center gap-4 text-center sm:mb-8">
          <span className="hidden h-px w-12 bg-linear-to-r from-transparent to-gold/50 sm:block sm:w-20" />
          <span className="h-px w-10 bg-linear-to-r from-transparent to-gold/50 sm:hidden" />
          <p
            className="font-arabic text-2xl leading-tight text-gold-soft drop-shadow-[0_0_18px_rgba(233,201,127,0.25)] sm:text-3xl"
            dir="rtl"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <span className="h-px w-10 bg-linear-to-l from-transparent to-gold/50 sm:hidden" />
          <span className="hidden h-px w-12 bg-linear-to-l from-transparent to-gold/50 sm:block sm:w-20" />
        </div>

        {/* Header — sticky for quick access while scrolling */}
        <header className="sticky top-0 z-30 -mx-4 border-b border-[var(--color-glass-border)] px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6"
          style={{ background: "color-mix(in srgb, var(--color-body-bg) 82%, transparent)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-gold/30 to-gold/5 text-gold ring-1 ring-gold/30">
                <LogoIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[17px] font-bold leading-tight text-cream">
                  Salat Times
                </p>
                <p
                  className="font-arabic text-[13px] leading-none text-gold/70"
                  dir="rtl"
                >
                  مواقيت الصلاة
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setPanel("search")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-cream/70 transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                aria-label="Search location"
                title="Search location"
              >
                <SearchIcon className="h-5 w-5" />
              </button>
              <button
                onClick={openLocate}
                disabled={locating}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-cream/70 transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold disabled:opacity-50"
                aria-label="Use my location"
                title="Use my location"
              >
                {locating ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-gold" />
                ) : (
                  <LocateIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => setPanel("settings")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/75 transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                aria-label="Settings"
                title="Settings"
              >
                <GearIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="mt-4 flex-1 sm:mt-6">
          {status === "error" && !hasData ? (
            <ErrorView
              message={error ?? "Something went wrong."}
              onRetry={openLocate}
              onSearch={() => setPanel("search")}
              locating={locating}
            />
          ) : !hasData ? (
            <Welcome
              busy={busy}
              hint={toast}
              onLocate={openLocate}
              onSearch={() => setPanel("search")}
            />
          ) : (
            <Results
              data={data!}
              tomorrow={tomorrow}
              location={location!}
              h12={settings.h12}
              school={settings.school}
              alertSound={settings.alertSound}
              hijriOffset={settings.hijriOffset}
              offline={status === "error"}
              refreshing={status === "loading"}
            />
          )}
        </main>

        <footer className="mt-10 border-t border-[var(--color-glass-border)] pt-6 text-center">
          <p className="text-xs text-cream/60">
            Prayer times by the Aladhan API · Places by OpenStreetMap
          </p>
          {hasData && (
            <p className="mt-1.5 text-[11px] text-cream/40">
              Method {data!.method} ·{" "}
              {settings.school === 1 ? "Hanafi" : "Shafi"} Asr ·{" "}
              {settings.h12 ? "12h" : "24h"}
              {settings.hijriOffset !== 0 &&
                ` · Hijri ${settings.hijriOffset > 0 ? "+" : ""}${settings.hijriOffset}d`}
            </p>
          )}
        </footer>
      </div>

      <Suspense>
        <SearchPanel
          open={panel === "search"}
          onClose={() => setPanel(null)}
          onSelect={selectPlace}
          onUseLocation={openLocate}
        />
        <SettingsPanel
          open={panel === "settings"}
          onClose={() => setPanel(null)}
          settings={settings}
          onChange={setSettings}
        />
      </Suspense>
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
