import { useMemo } from "react";
import { FajrIcon } from "./Icons";
import {
  getNextIslamicEvent,
  formatEventDate,
} from "../lib/islamicEvents";

export default function IslamicCountdown() {
  const next = useMemo(() => getNextIslamicEvent(), []);
  if (!next) return null;
  const { event, daysLeft, isToday } = next;
  return (
    <section
      aria-label={`Countdown to ${event.label}`}
      className="animate-fadeUp flex items-center gap-3 rounded-3xl border border-gold/30 bg-linear-to-br from-gold/[0.14] to-gold/[0.03] px-4 py-3 shadow-[0_0_32px_-12px_rgba(233,201,127,0.4)] sm:px-5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/30">
        <FajrIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gold/80">
          {isToday ? "Today" : daysLeft === 1 ? "Tomorrow" : `In ${daysLeft} days`} · {formatEventDate(event.date)}
        </p>
        <p className="truncate text-[15px] font-semibold text-cream">
          {event.label}{" "}
          <span className="font-arabic font-normal text-cream/70" dir="rtl">
            {event.arabic}
          </span>
        </p>
        <p className="text-[11px] text-cream/45">
          Estimated — moon sighting may shift ±1 day
        </p>
      </div>
    </section>
  );
}
