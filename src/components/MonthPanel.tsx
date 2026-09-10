import { useEffect, useState } from "react";
import Modal from "./Modal";
import { CalendarIcon } from "./Icons";
import {
  fetchMonthTimings,
  PRAYER_ORDER,
  parseHM,
  formatHM,
  type MonthDay,
} from "../lib/api";
import type { LocationInfo } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  location: LocationInfo;
  method: number;
  school: number;
  h12: boolean;
}

function monthLabel(y: number, m: number) {
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function MonthPanel({
  open,
  onClose,
  location,
  method,
  school,
  h12,
}: Props) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [days, setDays] = useState<MonthDay[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NOTE: no reset-on-open effect needed — the parent mounts this panel
  // only while open, so the useState initializer above is always current.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let cancelled = false;
    // Data-fetch pattern: reflect the new request synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    fetchMonthTimings(location.lat, location.lon, method, school, ym.m, ym.y, {
      signal: controller.signal,
    })
      .then((d) => {
        if (!cancelled) {
          setDays(d);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (cancelled || controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Couldn't load the month.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [open, ym.y, ym.m, location.lat, location.lon, method, school]);

  function shift(delta: number) {
    setYm(({ y, m }) => {
      const d = new Date(y, m - 1 + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() + 1 };
    });
  }

  const isCurrentMonth =
    ym.y === now.getFullYear() && ym.m === now.getMonth() + 1;
  const hijriRange =
    days && days.length > 0 ? `${days[0].hijri} – ${days[days.length - 1].hijri}` : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={monthLabel(ym.y, ym.m)}
      icon={<CalendarIcon className="h-5 w-5 text-gold" />}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/70 transition hover:border-gold/40 hover:text-gold"
        >
          ‹
        </button>
        <div className="text-center">
          {hijriRange && (
            <p className="text-xs text-gold/80">{hijriRange} Hijri</p>
          )}
          {!isCurrentMonth && (
            <button
              onClick={() => {
                const n = new Date();
                setYm({ y: n.getFullYear(), m: n.getMonth() + 1 });
              }}
              className="text-xs font-semibold text-cream/60 underline-offset-2 hover:text-gold hover:underline"
            >
              Back to current month
            </button>
          )}
        </div>
        <button
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/70 transition hover:border-gold/40 hover:text-gold"
        >
          ›
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-10 text-sm text-cream/60">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-gold" />
          Loading timetable…
        </div>
      )}

      {error && !loading && (
        <div className="py-6 text-center">
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
          <button
            onClick={() => setYm({ ...ym })}
            className="mt-3 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20"
          >
            Retry
          </button>
        </div>
      )}

      {days && !loading && !error && (
        <div className="max-h-[60vh] overflow-auto rounded-2xl border border-[var(--color-glass-border)]">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--color-surface-strong)]">
                <th className="sticky left-0 bg-[var(--color-surface-strong)] px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-cream/60">
                  Day
                </th>
                {PRAYER_ORDER.map((p) => (
                  <th
                    key={p.key}
                    className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-cream/60"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const isToday = isCurrentMonth && d.dayNum === now.getDate();
                return (
                  <tr
                    key={d.dayNum}
                    className={`border-t border-[var(--color-glass-border)] ${
                      isToday ? "bg-gold/10" : ""
                    }`}
                  >
                    <td className="sticky left-0 bg-[var(--color-surface-strong)] px-3 py-2">
                      <span className="tnum font-display font-bold text-cream">
                        {d.dayNum}
                      </span>{" "}
                      <span className="text-[11px] text-cream/50">
                        {d.weekday.slice(0, 3)}
                      </span>
                      {isToday && (
                        <span className="ml-1.5 rounded-full bg-gold px-1.5 py-px text-[9px] font-bold text-night">
                          TODAY
                        </span>
                      )}
                    </td>
                    {PRAYER_ORDER.map((p) => {
                      const { h, m } = parseHM(d.timings[p.key] ?? "");
                      return (
                        <td
                          key={p.key}
                          className="tnum whitespace-nowrap px-3 py-2 text-right text-cream/85"
                        >
                          {d.timings[p.key] ? formatHM(h, m, h12) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
