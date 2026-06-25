import { useCallback, useEffect, useRef, useState } from "react";
import Background from "./components/Background";
import LocationBar from "./components/LocationBar";
import NextPrayer from "./components/NextPrayer";
import PrayerCard, { type CardStatus } from "./components/PrayerCard";
import Qibla from "./components/Qibla";
import SearchPanel from "./components/SearchPanel";
import SettingsPanel from "./components/SettingsPanel";
import { LogoIcon, LocateIcon, SearchIcon, GearIcon } from "./components/Icons";
import { useNow } from "./hooks/useNow";
import {
  PRAYER_ORDER,
  SALAH_ORDER,
  getStatus,
  countdown,
  parseHM,
  formatHM,
  zonedNowMs,
  qiblaBearing,
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

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [location, setLocation] = useState<LocationInfo | null>(() =>
    loadLocation(),
  );
  const [data, setData] = useState<PrayerData | null>(() => loadCachedData());
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [panel, setPanel] = useState<"search" | "settings" | null>(null);
  const [locating, setLocating] = useState(false);

  const now = useNow(1000);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const didInit = useRef(false);
  const skipSettings = useRef(true);

  const loadFor = useCallback(async (loc: LocationInfo, s: Settings) => {
    setStatus("loading");
    setError(null);
    try {
      const d = await fetchTimings(loc.lat, loc.lon, s.method, s.school);
      setData(d);
      saveCachedData(d);
      setLocation(loc);
      saveLocation(loc);
      setStatus("idle");
    } catch (e) {
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
        setHint(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unable to get location.";
        if (silent) {
          setHint(msg);
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
      setLocation(saved);
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

  // Re-fetch when the calculation method / school changes.
  useEffect(() => {
    if (skipSettings.current) {
      skipSettings.current = false;
      return;
    }
    if (location) loadFor(location, settings);
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
              hint={hint}
              onLocate={openLocate}
              onSearch={() => setPanel("search")}
            />
          ) : (
      <Results
        data={data!}
        location={location!}
        now={now}
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
    </>
  );
}

/* ----------------------------- Results view ----------------------------- */

function Results({
  data,
  location,
  now,
  h12,
  hijriOffset,
  locating,
  onSearch,
  onLocate,
}: {
  data: PrayerData;
  location: LocationInfo;
  now: number;
  h12: boolean;
  hijriOffset: number;
  locating: boolean;
  onSearch: () => void;
  onLocate: () => void;
}) {
  const tz = data.timezone;
  const nowMs = zonedNowMs(tz, now);
  const { next: nextSalah, prev: prevSalah } = getStatus(
    SALAH_ORDER,
    data.timings,
    tz,
    nowMs,
  );
  const { next: nextEvent } = getStatus(PRAYER_ORDER, data.timings, tz, nowMs);
  const remaining = countdown(nextSalah.ms - nowMs);
  const span = Math.max(1, nextSalah.ms - prevSalah.ms);
  const progress = clamp((nowMs - prevSalah.ms) / span, 0, 1);
  const nextFormatted = formatHM(nextSalah.h, nextSalah.m, h12);
  const bearing = qiblaBearing(location.lat, location.lon);

  return (
    <div className="space-y-5">
      <LocationBar
        location={location}
        data={data}
        now={now}
        h12={h12}
        hijriOffset={hijriOffset}
        locating={locating}
        onSearch={onSearch}
        onLocate={onLocate}
      />

      <NextPrayer
        next={nextSalah}
        formattedTime={nextFormatted}
        remaining={remaining}
        progress={progress}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {PRAYER_ORDER.map((item, idx) => {
          const { h, m } = parseHM(data.timings[item.key]);
          const time = formatHM(h, m, h12);
          let s: CardStatus = "idle";
          if (item.key === nextSalah.key) s = "next";
          else if (item.key === prevSalah.key && item.key !== "Sunrise")
            s = "current";
          else if (item.key === "Sunrise" && nextEvent.key === "Sunrise")
            s = "soon";
          return (
            <PrayerCard
              key={item.key}
              item={item}
              time={time}
              status={s}
              index={idx}
            />
          );
        })}
      </div>

      <Qibla bearing={bearing} lat={location.lat} lon={location.lon} />
    </div>
  );
}

/* ------------------------------ Welcome view ----------------------------- */

function Welcome({
  busy,
  hint,
  onLocate,
  onSearch,
}: {
  busy: boolean;
  hint: string | null;
  onLocate: () => void;
  onSearch: () => void;
}) {
  return (
    <div className="animate-fadeUp mx-auto flex max-w-lg flex-col items-center pt-8 text-center sm:pt-14">
      <span className="animate-floaty relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-gold/30 to-gold/5 text-gold ring-1 ring-gold/30">
        <span
          className="absolute inset-0 rounded-3xl"
          style={{ animation: "pulseRing 3.5s ease-out infinite" }}
        />
        <LogoIcon className="h-11 w-11" />
      </span>

      <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-cream sm:text-5xl">
        Salat <span className="shimmer-text">Times</span>
      </h1>
      <p className="mt-1 font-arabic text-2xl text-gold/80" dir="rtl">
        مواقيت الصلاة
      </p>
      <p className="mt-4 max-w-sm text-balance text-cream/55">
        Accurate daily prayer times, the Hijri date and Qibla direction — for
        your location or any city in the world.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onLocate}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-gold to-gold-soft px-6 py-3.5 font-semibold text-night shadow-lg shadow-gold/20 transition hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
        >
          {busy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-night/40 border-t-night" />
          ) : (
            <LocateIcon className="h-5 w-5" />
          )}
          {busy ? "Detecting location…" : "Use my location"}
        </button>
        <button
          onClick={onSearch}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-cream transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
        >
          <SearchIcon className="h-5 w-5" />
          Search a city
        </button>
      </div>

      <p className="mt-5 min-h-[2.5rem] max-w-sm text-sm text-cream/45">
        {busy
          ? "Fetching the most accurate prayer times for you…"
          : hint ??
            "We never store your data — your location stays on your device."}
      </p>
    </div>
  );
}

/* ------------------------------- Error view ------------------------------ */

function ErrorView({
  message,
  onRetry,
  onSearch,
  locating,
}: {
  message: string;
  onRetry: () => void;
  onSearch: () => void;
  locating: boolean;
}) {
  return (
    <div className="animate-fadeUp mx-auto flex max-w-lg flex-col items-center pt-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-300 ring-1 ring-red-400/30">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          className="h-8 w-8"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold text-cream">
        Couldn’t load times
      </h2>
      <p className="mt-2 max-w-sm text-cream/55">{message}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onRetry}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-gold to-gold-soft px-5 py-3 font-semibold text-night transition hover:brightness-105 active:scale-95 disabled:opacity-70"
        >
          {locating ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-night/40 border-t-night" />
          ) : (
            <LocateIcon className="h-5 w-5" />
          )}
          Try again
        </button>
        <button
          onClick={onSearch}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-cream transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
        >
          <SearchIcon className="h-5 w-5" />
          Search a city
        </button>
      </div>
    </div>
  );
}
