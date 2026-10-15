import { useMemo } from "react";
import { FajrIcon, MaghribIcon } from "./Icons";
import { parseHM } from "../lib/api";
import { ramadanDayNumber, type RamadanRange } from "../lib/islamicEvents";

interface Props {
  fajr: string;
  maghrib: string;
  range: RamadanRange;
}

function formatHM(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function FastingCard({ fajr, maghrib, range }: Props) {
  const info = useMemo(() => {
    const f = parseHM(fajr);
    const g = parseHM(maghrib);
    let mins = g.h * 60 + g.m - (f.h * 60 + f.m);
    if (mins < 0) mins += 24 * 60;
    return {
      fajrLabel: formatHM(f.h, f.m),
      maghribLabel: formatHM(g.h, g.m),
      length: `${Math.floor(mins / 60)}h ${mins % 60}m`,
      day: ramadanDayNumber(range),
    };
  }, [fajr, maghrib, range]);

  return (
    <section
      aria-label={`Ramadan fasting times, day ${info.day}`}
      className="animate-fadeUp rounded-3xl border border-gold/30 bg-linear-to-br from-gold/[0.14] to-gold/[0.03] p-5 shadow-[0_0_32px_-12px_rgba(233,201,127,0.4)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-cream">
            Ramadan Mubarak
          </h3>
          <p className="font-arabic text-sm text-gold/80" dir="rtl">
            رَمَضَان مُبَارَك
          </p>
        </div>
        <span className="tnum shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-bold text-night">
          Day {info.day}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-cream/60 sm:text-[11px]">
            <FajrIcon className="h-3.5 w-3.5 text-gold/80" /> Suhoor ends
          </p>
          <p className="tnum font-display text-xl font-bold text-cream sm:text-2xl">
            {info.fajrLabel}
          </p>
          <p className="text-[11px] text-cream/55">by Fajr</p>
        </div>
        <div className="rounded-2xl border border-gold/40 bg-gold/[0.12] px-3 py-2.5 sm:px-4 sm:py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-gold/80 sm:text-[11px]">
            <MaghribIcon className="h-3.5 w-3.5" /> Iftar
          </p>
          <p className="tnum font-display text-xl font-bold text-gold sm:text-2xl">
            {info.maghribLabel}
          </p>
          <p className="text-[11px] text-cream/55">at Maghrib</p>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-cream/60">
        Fast length today · <span className="tnum font-semibold text-cream">{info.length}</span>
      </p>
    </section>
  );
}
