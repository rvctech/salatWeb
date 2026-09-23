import type { Ref } from "react";
import { PRAYER_ICONS } from "./Icons";
import { ArrowRightIcon } from "./Icons";
import { cn } from "../utils/cn";
import type { OrderItem } from "../lib/api";

export type CardStatus = "idle" | "next" | "current" | "soon";

interface Props {
  item: OrderItem;
  time: string;
  status: CardStatus;
  index: number;
  isTomorrow?: boolean;
  ref?: Ref<HTMLDivElement>;
}

const TILE: Record<CardStatus, string> = {
  next: "bg-linear-to-br from-gold/30 to-gold/5 text-gold ring-1 ring-gold/40",
  current: "bg-tealglow/15 text-accent-strong ring-1 ring-tealglow/30",
  soon: "bg-gold/10 text-gold-soft ring-1 ring-gold/20",
  idle: "bg-[var(--color-glass-bg)] text-cream/70 ring-1 ring-[var(--color-glass-border)]",
};

const ROW: Record<CardStatus, string> = {
  next: "border-gold/45 bg-linear-to-r from-gold/[0.12] to-transparent shadow-[0_0_32px_-12px_rgba(233,201,127,0.5)]",
  current: "border-tealglow/35 bg-tealglow/[0.06]",
  soon: "border-gold/25 bg-gold/[0.04]",
  idle: "border-[var(--color-glass-border)] hover:border-cream/25 hover:bg-cream/[0.04]",
};

const BADGE: Record<CardStatus, { text: string; cls: string } | null> = {
  next: { text: "NEXT", cls: "bg-gold text-night" },
  current: { text: "NOW", cls: "bg-teal-300/90 text-night" },
  soon: { text: "SOON", cls: "bg-gold/20 text-gold border border-gold/30" },
  idle: null,
};

export default function PrayerCard({ item, time, status, index, isTomorrow, ref }: Props) {
  const Icon = PRAYER_ICONS[item.key] ?? PRAYER_ICONS.Dhuhr;
  const badge = BADGE[status];
  const highlighted = status !== "idle";
  return (
    <div
      ref={ref}
      className={cn(
        "animate-fadeUp relative flex scroll-mt-28 items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-300 sm:gap-4 sm:px-4 sm:py-3",
        ROW[status],
        highlighted && "sm:py-3.5",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* left accent for next */}
      {status === "next" && (
        <span className="absolute inset-y-2.5 left-0 w-1 rounded-full bg-gold shadow-[0_0_12px_rgba(233,201,127,0.9)]" aria-hidden="true" />
      )}

      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12",
          TILE[status],
        )}
      >
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold tracking-wide text-cream sm:text-base">
              {item.name}
            </span>
            {badge && (
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest",
                  badge.cls,
                )}
              >
                {badge.text}
              </span>
            )}
            {!badge && isTomorrow && (
              <span className="shrink-0 rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-cream/60">
                TOMORROW
              </span>
            )}
          </div>
          <span className="block truncate font-arabic text-[15px] leading-tight text-cream/60" dir="rtl">
            {item.arabic}
          </span>
        </div>
      </div>

      <span
        className={cn(
          "tnum shrink-0 font-display text-xl font-bold tabular-nums sm:text-2xl",
          status === "next" ? "text-gold" : "text-cream",
        )}
      >
        {time}
      </span>

      {status === "next" && (
        <ArrowRightIcon className="hidden h-4 w-4 shrink-0 text-gold/50 sm:block" aria-hidden="true" />
      )}
    </div>
  );
}
