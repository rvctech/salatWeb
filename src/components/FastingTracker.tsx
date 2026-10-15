import { useMemo, useState } from "react";
import { CheckIcon } from "./Icons";
import { dayStr } from "../lib/tracker";
import {
  loadFast,
  ramadanDayKeys,
  setFast,
  type FastStatus,
} from "../lib/fasting";
import type { RamadanRange } from "../lib/islamicEvents";

export default function FastingTracker({ range }: { range: RamadanRange }) {
  const keys = useMemo(
    () => ramadanDayKeys(range.startISO, range.endISO),
    [range.startISO, range.endISO],
  );
  const today = dayStr();
  const [log, setLog] = useState<Record<string, FastStatus | null>>(() => {
    const init: Record<string, FastStatus | null> = {};
    for (const k of ramadanDayKeys(range.startISO, range.endISO)) {
      init[k] = loadFast(k);
    }
    return init;
  });

  const elapsed = keys.filter((k) => k <= today);
  const kept = elapsed.filter((k) => log[k] === "kept").length;

  function mark(status: FastStatus | null) {
    setLog((prev) => ({ ...prev, [today]: status }));
    setFast(today, status);
  }

  const current = log[today] ?? null;

  return (
    <section
      aria-label="Ramadan fasting tracker"
      className="animate-fadeUp rounded-3xl border border-gold/30 bg-linear-to-br from-gold/[0.10] to-gold/[0.02] p-5 shadow-[0_0_32px_-12px_rgba(233,201,127,0.35)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/30">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-cream">
              Fasting Tracker
            </h3>
            <p className="tnum text-xs text-cream/60">
              {kept}/{elapsed.length} fasts kept
            </p>
          </div>
        </div>
      </div>

      {/* today */}
      <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-1">
        {(
          [
            { v: "kept", label: "Fasted today" },
            { v: "missed", label: "Missed" },
          ] as const
        ).map((o) => (
          <button
            key={o.v}
            onClick={() => mark(current === o.v ? null : o.v)}
            aria-pressed={current === o.v}
            className={`min-h-[44px] rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              current === o.v
                ? o.v === "kept"
                  ? "bg-emerald-400 text-night shadow"
                  : "bg-red-400/90 text-night shadow"
                : "text-cream/65 hover:text-cream"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* month dots */}
      <div className="mt-4 grid grid-cols-10 gap-1.5">
        {keys.map((k, i) => {
          const s = k === today ? current : (log[k] ?? null);
          const future = k > today;
          return (
            <div
              key={k}
              title={`${k}: ${s ?? "—"}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-[10px] font-bold ${
                s === "kept"
                  ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-200"
                  : s === "missed"
                    ? "border-red-400/50 bg-red-400/15 text-red-300"
                    : future
                      ? "border-[var(--color-glass-border)] text-cream/25"
                      : "border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/50"
              } ${k === today ? "ring-1 ring-gold" : ""}`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-cream/45">
        Only shown during Ramadan · saved on this device.
      </p>
    </section>
  );
}
