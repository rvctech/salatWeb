import { LogoIcon, LocateIcon, SearchIcon } from "./Icons";

interface Props {
  busy: boolean;
  hint: string | null;
  onLocate: () => void;
  onSearch: () => void;
}

export default function Welcome({
  busy,
  hint,
  onLocate,
  onSearch,
}: Props) {
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
