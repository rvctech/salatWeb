import { PRAYER_ICONS } from "./Icons";
import { cn } from "../utils/cn";
import type { OrderItem } from "../lib/api";

export type CardStatus = "idle" | "next" | "current" | "soon";

interface Props {
  item: OrderItem;
  time: string;
  status: CardStatus;
  index: number;
}

const TILE: Record<CardStatus, string> = {
  next: "bg-linear-to-br from-gold/30 to-gold/5 text-gold ring-1 ring-gold/40",
  current: "bg-tealglow/15 text-teal-200 ring-1 ring-tealglow/30",
  soon: "bg-gold/10 text-gold-soft ring-1 ring-gold/20",
  idle: "bg-white/[0.04] text-cream/70 ring-1 ring-white/8",
};

const CARD: Record<CardStatus, string> = {
  next: "border-gold/45 bg-linear-to-b from-gold/[0.12] to-transparent shadow-[0_0_40px_-12px_rgba(233,201,127,0.5)]",
  current: "border-tealglow/35 bg-tealglow/[0.06]",
  soon: "border-gold/25 bg-gold/[0.04]",
  idle: "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]",
};

const BADGE: Record<CardStatus, { text: string; cls: string } | null> = {
  next: { text: "NEXT", cls: "bg-gold text-night" },
  current: { text: "NOW", cls: "bg-teal-300/90 text-night" },
  soon: { text: "SOON", cls: "bg-gold/20 text-gold border border-gold/30" },
  idle: null,
};

export default function PrayerCard({ item, time, status, index }: Props) {
  const Icon = PRAYER_ICONS[item.key] ?? PRAYER_ICONS.Dhuhr;
  const badge = BADGE[status];
  return (
    <div
      className={cn(
        "animate-fadeUp relative flex flex-col gap-4 rounded-2xl border p-4 transition-all duration-300 sm:p-5",
        CARD[status],
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {status === "next" && (
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ animation: "pulseRing 3s ease-out infinite" }}
        />
      )}

      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            TILE[status],
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        {badge && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest",
              badge.cls,
            )}
          >
            {badge.text}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <span className="text-[15px] font-semibold tracking-wide text-cream">
          {item.name}
        </span>
        <span
          className="font-arabic text-lg leading-none text-cream/55"
          dir="rtl"
        >
          {item.arabic}
        </span>
      </div>

      <span
        className={cn(
          "tnum font-display text-2xl font-semibold sm:text-[1.7rem]",
          status === "next" ? "text-gold" : "text-cream/90",
        )}
      >
        {time}
      </span>
    </div>
  );
}
