import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import Background from "./components/Background";
import { LogoIcon, GearIcon } from "./components/Icons";
import {
  fetchTimings,
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

  // Apply theme to document.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
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

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        {/* Bismillah banner */}
        <div className="animate-fadeIn mb-7 flex items-center justify-center gap-4 text-center sm:mb-8">
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

        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="animate-floaty flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-gold/30 to-gold/5 text-gold ring-1 ring-gold/30">
              <LogoIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-cream">
                Salat Times
              </p>
              <p
                className="font-arabic text-sm leading-none text-gold/70"
                dir="rtl"
              >
                مواقيت الصلاة
              </p>
            </div>
          </div>
          <button
            onClick={() => setPanel("settings")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/5 text-cream/75 transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
            aria-label="Settings"
          >
            <GearIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="mt-6 flex-1">
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
              location={location!}
              h12={settings.h12}
              hijriOffset={settings.hijriOffset}
              locating={locating}
              onSearch={() => setPanel("search")}
              onLocate={openLocate}
            />
          )}
        </main>

        <footer className="mt-10 border-t border-white/8 pt-6 text-center">
          <p className="text-xs text-cream/35">
            Prayer times by the Aladhan API · Places by OpenStreetMap
          </p>
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
