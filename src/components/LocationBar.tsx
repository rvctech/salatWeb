import type { ReactNode } from "react";
import {
  PinIcon,
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
}

function InfoTile({
  icon,
  label,
  value,
  sub,
  gold,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  gold?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2.5 rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 ${className}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-glass-bg)] text-gold/80 ring-1 ring-[var(--color-glass-border)] sm:h-9 sm:w-9">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-cream/60 sm:text-[11px]">
          {label}
        </p>
        <p
          className={`break-words font-display text-[15px] font-semibold leading-snug sm:text-base ${
            gold ? "text-gold" : "text-cream"
          }`}
        >
          {value}
        </p>
        {sub && (
          <p className="truncate text-[11px] text-cream/60 sm:text-xs">{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function LocationBar({
  location,
  data,
  now,
  h12,
  hijriOffset = 0,
}: Props) {
  const tz = data?.timezone;
  const clock = tz ? zonedClock(tz, now, h12) : "—";

  return (
    <section className="animate-fadeUp rounded-3xl border border-[var(--color-glass-border)] glass p-4 sm:p-6">
      {/* Display-only: Search / Locate live in the sticky header. */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold ring-1 ring-gold/30 sm:h-12 sm:w-12">
          <PinIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-bold text-cream sm:text-2xl">
            {location?.label ?? "—"}
          </h1>
          {location?.sublabel ? (
            <p className="truncate text-[13px] text-cream/60 sm:text-sm">
              {location.sublabel}
            </p>
          ) : (
            <p className="text-[13px] text-cream/60 sm:text-sm">
              {location?.source === "geo" ? "Detected location" : "Saved location"}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
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
          className="col-span-2 sm:col-span-1"
        />
      </div>
    </section>
  );
}
