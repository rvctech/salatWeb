import type { ReactNode } from "react";
import {
  PinIcon,
  SearchIcon,
  LocateIcon,
  ClockIcon,
  CalendarIcon,
  SparkleIcon,
} from "./Icons";
import { zonedClock, adjustedHijri } from "../lib/api";
import type { LocationInfo, PrayerData } from "../lib/types";

interface Props {
  location: LocationInfo | null;
  data: PrayerData | null;
  now: number;
  h12: boolean;
  hijriOffset: number;
  locating: boolean;
  onSearch: () => void;
  onLocate: () => void;
}

function InfoTile({
  icon,
  label,
  value,
  sub,
  gold,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  gold?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold/80 ring-1 ring-white/8">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-cream/40">
          {label}
        </p>
        <p
          className={`truncate font-display font-semibold ${
            gold ? "text-gold" : "text-cream"
          }`}
        >
          {value}
        </p>
        {sub && <p className="truncate text-xs text-cream/40">{sub}</p>}
      </div>
    </div>
  );
}

const BTN =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-sm font-medium text-cream/80 transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold active:scale-95";

export default function LocationBar({
  location,
  data,
  now,
  h12,
  hijriOffset = 0,
  locating,
  onSearch,
  onLocate,
}: Props) {
  const tz = data?.timezone;
  const clock = tz ? zonedClock(tz, now, h12) : "—";

  return (
    <section className="animate-fadeUp rounded-3xl border border-white/10 glass p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-gold/30">
            <PinIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold text-cream sm:text-2xl">
              {location?.label ?? "—"}
            </h1>
            {location?.sublabel ? (
              <p className="truncate text-sm text-cream/50">
                {location.sublabel}
              </p>
            ) : (
              <p className="text-sm text-cream/40">
                {location?.source === "geo" ? "Detected location" : "Saved location"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onSearch} className={BTN} aria-label="Search location">
            <SearchIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            onClick={onLocate}
            className={BTN}
            aria-label="Use my location"
            disabled={locating}
          >
            {locating ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-gold"
                style={{ animationDuration: "0.7s" }}
              />
            ) : (
              <LocateIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InfoTile
          icon={<ClockIcon className="h-4 w-4" />}
          label="Local time"
          value={clock}
          sub={tz}
        />
        <InfoTile
          icon={<SparkleIcon className="h-4 w-4" />}
          label="Hijri date"
          value={
            data
              ? adjustedHijri(
                  data.hijriDay,
                  data.hijriMonthEn,
                  data.hijriYear,
                  hijriOffset,
                )
              : "—"
          }
          gold
        />
        <InfoTile
          icon={<CalendarIcon className="h-4 w-4" />}
          label="Gregorian"
          value={data?.weekday ?? "—"}
          sub={data?.gregorian}
        />
      </div>
    </section>
  );
}
