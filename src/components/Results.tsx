import { Suspense, lazy, useEffect, useState } from "react";
import { ensureAudio, playAdhan, playPing, stopAdhan } from "../lib/notify";
import type { AlertSound } from "../lib/api";

const MonthPanel = lazy(() => import("./MonthPanel"));
import {
  PRAYER_ORDER,
  SALAH_ORDER,
  getStatus,
  countdown,
  parseHM,
  formatHM,
  zonedNowMs,
  qiblaBearing,
  loadCacheTime,
  formatCacheAge,
} from "../lib/api";
import { useNow } from "../hooks/useNow";
import LocationBar from "./LocationBar";
import NextPrayer from "./NextPrayer";
import PrayerCard, { type CardStatus } from "./PrayerCard";
import Qibla from "./Qibla";
import type { LocationInfo, PrayerData } from "../lib/types";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

interface Props {
  data: PrayerData;
  tomorrow?: PrayerData | null;
  location: LocationInfo;
  h12: boolean;
  school: number;
  alertSound: AlertSound;
  hijriOffset: number;
  offline?: boolean;
  refreshing?: boolean;
}

export default function Results({
  data,
  tomorrow,
  location,
  h12,
  school,
  alertSound,
  hijriOffset,
  offline,
  refreshing,
}: Props) {
  const [tab, setTab] = useState<0 | 1>(0);
  const [monthOpen, setMonthOpen] = useState(false);
  const [alertsOn, setAlertsOn] = useState(
    () =>
      typeof Notification !== "undefined" &&
      Notification.permission === "granted",
  );
  const canAskAlerts =
    typeof Notification !== "undefined" && Notification.permission === "default";

  const now = useNow(1000);
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

  const isTomorrow = nextSalah.dayOffset > 0;

  const cacheAge = formatCacheAge(loadCacheTime(), now);

  // Live tab title countdown.
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    document.title = `${pad(remaining.h)}:${pad(remaining.m)}:${pad(remaining.s)} until ${nextSalah.name} · Salat Times`;
    return () => {
      document.title = "Salat Times — Prayer Times, Hijri Date & Qibla";
    };
  }, [remaining.h, remaining.m, remaining.s, nextSalah.name]);

  // Prayer alert at exact time: OS notification + soft ping.
  // Page must stay open (in-tab timer, no push). Re-arms per prayer.
  useEffect(() => {
    if (!alertsOn || typeof Notification === "undefined") return;
    const ms = Math.max(0, nextSalah.ms - zonedNowMs(tz, Date.now()));
    if (!Number.isFinite(ms) || ms > 2147483647) return;
    const t = setTimeout(() => {
      if (alertSound === "adhan") playAdhan();
      else playPing();
      try {
        new Notification(`Time for ${nextSalah.name}`, {
          body: `${nextSalah.name} is now · ${nextFormatted}`,
          tag: `salat-${nextSalah.key}`,
        });
      } catch {
        /* ignore */
      }
    }, ms);
    return () => clearTimeout(t);
  }, [alertsOn, alertSound, nextSalah.ms, nextSalah.key, nextSalah.name, nextFormatted, tz]);

  async function enableAlerts() {
    ensureAudio();
    if (alertSound === "adhan") playAdhan();
    else playPing(0.08); // soft preview so the user hears what to expect
    try {
      const p = await Notification.requestPermission();
      setAlertsOn(p === "granted");
    } catch {
      /* notification blocked — sound alerts still work while open */
      setAlertsOn(true);
    }
  }

  function disableAlerts() {
    stopAdhan();
    setAlertsOn(false);
  }

  return (
    <div
      className={`space-y-5 transition-opacity duration-300 ${refreshing ? "pointer-events-none opacity-60" : ""}`}
      aria-busy={refreshing || undefined}
    >
      {offline && (
        <p
          role="status"
          className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-center text-[13px] font-medium text-cream"
        >
          Offline — showing cached times · Updated {cacheAge}
        </p>
      )}
      <LocationBar
        location={location}
        data={data}
        now={now}
        h12={h12}
        hijriOffset={hijriOffset}
      />

      <NextPrayer
        next={nextSalah}
        prevName={prevSalah.name}
        formattedTime={nextFormatted}
        remaining={remaining}
        progress={progress}
        isTomorrow={isTomorrow}
      />

      {(canAskAlerts || alertsOn) && (
        <button
          onClick={() => (alertsOn ? disableAlerts() : void enableAlerts())}
          aria-pressed={alertsOn}
          className={`w-full rounded-2xl border px-4 py-2.5 text-[13px] font-semibold transition active:scale-[0.99] ${
            alertsOn
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
              : "border-gold/30 bg-gold/10 text-gold hover:bg-gold/20"
          }`}
        >
          {alertsOn
            ? `Prayer alerts on (${alertSound === "adhan" ? "Adhan" : "ping"}) · Turn off`
            : `Enable prayer alerts — ${alertSound === "adhan" ? "Adhan" : "ping"} + notify at ${nextSalah.name} time`}
        </button>
      )}

      <section aria-label="Prayer timetable">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-cream/60">
            Timetable
          </h3>
          <button
            onClick={() => setMonthOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-3 py-1.5 text-xs font-semibold text-cream/75 transition hover:border-gold/40 hover:text-gold"
          >
            Month view
          </button>
        </div>
        <div
          role="tablist"
          aria-label="Day"
          className="mb-3 grid grid-cols-2 gap-1 rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-1"
        >
          {(
            [
              { v: 0, label: `Today · ${data.weekday}` },
              { v: 1, label: tomorrow ? `Tomorrow · ${tomorrow.weekday}` : "Tomorrow" },
            ] as const
          ).map((t) => (
            <button
              key={t.v}
              role="tab"
              aria-selected={tab === t.v}
              onClick={() => setTab(t.v)}
              className={`truncate rounded-xl px-3 py-2 text-sm font-medium transition ${
                tab === t.v
                  ? "bg-gold text-night shadow"
                  : "text-cream/65 hover:text-cream"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="space-y-2 sm:space-y-2.5" role="tabpanel">
          {PRAYER_ORDER.map((item, idx) => {
            const src = tab === 1 && tomorrow ? tomorrow.timings : data.timings;
            const { h, m } = parseHM(src[item.key]);
            const time = formatHM(h, m, h12);
            let s: CardStatus = "idle";
            if (tab === 0) {
              if (item.key === nextSalah.key) s = "next";
              else if (item.key === prevSalah.key && item.key !== "Sunrise")
                s = "current";
              else if (item.key === "Sunrise" && nextEvent.key === "Sunrise")
                s = "soon";
            }
            return (
              <PrayerCard
                key={item.key}
                item={item}
                time={time}
                status={s}
                index={idx}
                isTomorrow={tab === 0 && isTomorrow && item.key === nextSalah.key}
              />
            );
          })}
          {tab === 1 && !tomorrow && (
            <p className="rounded-xl bg-[var(--color-glass-bg)] px-3 py-2.5 text-center text-xs text-cream/60">
              Loading tomorrow's times…
            </p>
          )}
        </div>
      </section>

      <Qibla bearing={bearing} lat={location.lat} lon={location.lon} />

      <Suspense fallback={null}>
        {monthOpen && (
          <MonthPanel
            open
            onClose={() => setMonthOpen(false)}
            location={location}
            method={data.method}
            school={school}
            h12={h12}
          />
        )}
      </Suspense>
    </div>
  );
}
