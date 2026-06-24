import { PRAYER_ICONS } from "./Icons";
import type { Countdown, OrderItem } from "../lib/api";

interface Props {
  next: OrderItem;
  formattedTime: string;
  remaining: Countdown;
  progress: number;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function NextPrayer({
  next,
  formattedTime,
  remaining,
  progress,
}: Props) {
  const Icon = PRAYER_ICONS[next.key] ?? PRAYER_ICONS.Dhuhr;
  return (
    <section className="animate-fadeUp relative overflow-hidden rounded-3xl border border-gold/25 glass p-6 sm:p-8">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(233,201,127,0.28), transparent 65%)",
          animation: "glowPulse 9s ease-in-out infinite",
        }}
      />

      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        {/* left: identity */}
        <div className="flex items-center gap-4">
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-gold/30 to-gold/5 text-gold ring-1 ring-gold/40">
            <span
              className="absolute inset-0 rounded-2xl"
              style={{ animation: "pulseRing 3.5s ease-out infinite" }}
            />
            <Icon className="h-9 w-9" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/80">
              Up next
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
        <div className="flex items-center gap-2 sm:gap-3">
          <Unit value={pad(remaining.h)} label="Hours" />
          <Colon />
          <Unit value={pad(remaining.m)} label="Min" />
          <Colon />
          <Unit value={pad(remaining.s)} label="Sec" />
        </div>
      </div>

      {/* progress */}
      <div className="relative mt-7">
        <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wider text-cream/40">
          <span>Time until {next.name}</span>
          <span className="tnum">{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
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
    <div className="flex flex-col items-center">
      <span className="tnum font-display text-3xl font-bold tabular-nums text-cream sm:text-5xl">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-cream/40">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span
      className="font-display pb-5 text-2xl font-bold text-gold/70 sm:text-4xl"
      style={{ animation: "twinkle 1.6s ease-in-out infinite" }}
    >
      :
    </span>
  );
}
