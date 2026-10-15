import { useMemo, useState } from "react";
import { CheckIcon } from "./Icons";
import {
  TRACKED_PRAYERS,
  currentStreak,
  dayStr,
  isComplete,
  loadDay,
  loadWeek,
  saveDay,
  type TrackedPrayer,
} from "../lib/tracker";

export default function PrayerTracker() {
  const today = useMemo(() => dayStr(), []);
  const [record, setRecord] = useState(() => loadDay(today));
  const week = useMemo(() => loadWeek(), []);
  const [streak, setStreak] = useState(() => currentStreak());

  const done = TRACKED_PRAYERS.filter((p) => record[p]).length;
  const complete = isComplete(record);

  function toggle(prayer: TrackedPrayer) {
    setRecord((prev) => {
      const next = { ...prev, [prayer]: !prev[prayer] };
      saveDay(today, next);
      setStreak(currentStreak());
      return next;
    });
  }

  return (
    <section
      aria-label="Prayer tracker"
      className="animate-fadeUp rounded-3xl border border-[var(--color-glass-border)] glass p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/30">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-cream">
              Prayer Tracker
            </h3>
            <p className="text-xs text-cream/60">
              {done}/5 today
              {streak > 0 && (
                <span className="text-gold"> · {streak}-day streak</span>
              )}
            </p>
          </div>
        </div>
        {complete && (
          <span className="shrink-0 rounded-full bg-gold px-3 py-1 text-xs font-bold text-night">
            Complete
          </span>
        )}
      </div>

      {/* progress */}
      <div
        className="track mt-4 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-label={`${done} of 5 prayers done today`}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-gold/70 to-gold transition-[width] duration-300"
          style={{ width: `${(done / 5) * 100}%` }}
        />
      </div>

      <ul className="mt-3 space-y-2">
        {TRACKED_PRAYERS.map((prayer) => {
          const on = record[prayer];
          return (
            <li key={prayer}>
              <button
                onClick={() => toggle(prayer)}
                aria-pressed={on}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition active:scale-[0.99] ${
                  on
                    ? "border-gold/45 bg-gold/[0.12] shadow-[0_0_24px_-12px_rgba(233,201,127,0.5)]"
                    : "border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] hover:border-cream/25"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition ${
                    on
                      ? "border-gold bg-gold text-night"
                      : "border-cream/25 text-transparent"
                  }`}
                >
                  <CheckIcon className="h-4 w-4" />
                </span>
                <span
                  className={`flex-1 text-[15px] font-semibold ${
                    on ? "text-gold" : "text-cream"
                  }`}
                >
                  {prayer}
                </span>
                {on && (
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gold/70">
                    Done
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* last 7 days */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-cream/60">
          Last 7 days
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d) => (
            <div
              key={d.key}
              title={`${d.key}: ${d.done}/5`}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 ${
                d.isToday
                  ? "border-gold/50 bg-gold/10"
                  : "border-[var(--color-glass-border)] bg-[var(--color-glass-bg)]"
              }`}
            >
              <span className="text-[10px] font-semibold text-cream/50">
                {d.label}
              </span>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  d.complete
                    ? "bg-gold text-night"
                    : d.done > 0
                      ? "bg-gold/20 text-gold"
                      : "bg-cream/10 text-cream/40"
                }`}
              >
                {d.done}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-cream/45">
          Saved on this device only — streak counts days with all 5 done.
        </p>
      </div>
    </section>
  );
}
