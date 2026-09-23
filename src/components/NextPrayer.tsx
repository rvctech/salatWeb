import type { CSSProperties } from "react";
import { PRAYER_ICONS } from "./Icons";
import type { Countdown, OrderItem } from "../lib/api";

interface Props {
  next: OrderItem;
  prevName?: string;
  formattedTime: string;
  remaining: Countdown;
  progress: number;
  isTomorrow?: boolean;
  style?: CSSProperties;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function NextPrayer({
  next,
  prevName,
  formattedTime,
  remaining,
  progress,
  isTomorrow,
  style,
}: Props) {
  const Icon = PRAYER_ICONS[next.key] ?? PRAYER_ICONS.Dhuhr;
  const pct = Math.round(progress * 100);
  return (
    <section
      aria-label={`Next prayer ${next.name} at ${formattedTime}`}
      style={style}
      className="animate-fadeUp relative overflow-hidden rounded-3xl border border-gold/45 glass p-5 shadow-[0_0_60px_-15px_rgba(233,201,127,0.4)] sm:p-8"
    >
      {/* ambient glow — slow so the countdown stays the focal motion */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(233,201,127,0.28), transparent 65%)",
          animation: "glowPulse 14s ease-in-out infinite",
        }}
      />

      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        {/* left: identity */}
        <div className="flex items-center gap-4">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-gold/30 to-gold/5 text-gold ring-1 ring-gold/40">
            <Icon className="h-9 w-9" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/80">
              Up next{isTomorrow ? " — Tomorrow" : ""}
            </p>
            <h2 className="font-display text-3xl font-bold text-cream sm:text-4xl">
              {next.name}
            </h2>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-cream/60">
              <span className="font-arabic text-base text-cream/75" dir="rtl">
                {next.arabic}
              </span>
              <span className="text-cream/30">•</span>
              <span className="tnum">at {formattedTime}</span>
            </p>
          </div>
        </div>

        {/* right: countdown */}
        <div
          className="flex items-start gap-1.5 sm:gap-3"
          role="timer"
          aria-label={`${remaining.h} hours ${remaining.m} minutes remaining until ${next.name}`}
        >
          <Unit value={pad(remaining.h)} label="Hours" />
          <Colon />
          <Unit value={pad(remaining.m)} label="Min" />
          <Colon />
          <Unit value={pad(remaining.s)} label="Sec" />
          {/* Screen-reader friendly update, minute granularity to avoid spam */}
          <span className="sr-only" aria-live="polite">
            {remaining.h} hours {remaining.m} minutes until {next.name}
          </span>
        </div>
      </div>

      {/* progress */}
      <div className="relative mt-6 sm:mt-7">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-cream/60">
          <span>
            {prevName ? (
              <>
                {prevName} <span className="text-cream/30">→</span> {next.name}
              </>
            ) : (
              <>Until {next.name}</>
            )}
          </span>
          <span className="tnum">{pct}% elapsed</span>
        </div>
        <div
          className="track h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Time elapsed since ${prevName ?? "last prayer"}`}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-gold/70 to-gold transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.max(2, Math.min(100, progress * 100))}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-[3.2rem] flex-col items-center sm:min-w-[4.5rem]">
      <span className="tnum font-display text-2xl font-bold tabular-nums text-cream sm:text-5xl">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-cream/60">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span
      aria-hidden="true"
      className="font-display pb-5 text-xl font-bold text-gold/70 sm:text-4xl"
      style={{ animation: "twinkle 1.6s ease-in-out infinite" }}
    >
      :
    </span>
  );
}
