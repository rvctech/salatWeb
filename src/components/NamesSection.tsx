import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ALLAH_NAMES } from "../lib/names";
import { SparkleIcon, SearchIcon } from "./Icons";

const COLLAPSED_COUNT = 9;

function dayOfYear(d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export default function NamesSection({ style }: { style?: CSSProperties }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const daily = useMemo(
    () => ALLAH_NAMES[dayOfYear() % ALLAH_NAMES.length],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALLAH_NAMES;
    return ALLAH_NAMES.filter(
      (n) =>
        n.transliteration.toLowerCase().includes(q) ||
        n.meaning.toLowerCase().includes(q) ||
        n.arabic.includes(query.trim()) ||
        String(n.id) === q,
    );
  }, [query]);

  const searching = query.trim().length > 0;
  const visible =
    searching || expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);

  return (
    <section
      id="sec-names"
      aria-label="99 Names of Allah"
      style={style}
      className="animate-fadeUp scroll-mt-32 rounded-3xl border border-[var(--color-glass-border)] glass p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/30">
            <SparkleIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-cream">
              99 Names of Allah
            </h3>
            <p className="font-arabic text-sm leading-tight text-cream/60" dir="rtl">
              أَسْمَاءُ ٱللَّٰهِ ٱلْحُسْنَىٰ
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--color-glass-bg)] px-3 py-1 text-xs font-medium text-cream/60 ring-1 ring-[var(--color-glass-border)]">
          <span className="tnum">{searching ? filtered.length : 99}</span> names
        </span>
      </div>

      {/* Name of the day */}
      <div className="mt-4 rounded-2xl border border-gold/30 bg-linear-to-br from-gold/[0.14] to-gold/[0.03] px-4 py-3 text-center shadow-[0_0_32px_-12px_rgba(233,201,127,0.4)]">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gold/80">
          Name of the day · {daily.id}/99
        </p>
        <p className="font-arabic mt-1 text-2xl leading-snug text-cream" dir="rtl">
          {daily.arabic}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-gold">
          {daily.transliteration} · {daily.meaning}
        </p>
      </div>

      <div className="relative mt-3">
        <label htmlFor="names-search" className="sr-only">
          Search the 99 names
        </label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/60" />
        <input
          id="names-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, meaning, or number…"
          autoComplete="off"
          className="min-h-[44px] w-full rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] py-2.5 pl-11 pr-4 text-sm text-cream placeholder:text-cream/60 outline-none transition focus:border-gold/50"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[var(--color-glass-bg)] px-4 py-3 text-center text-sm text-cream/60">
          No names match “{query}”.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-2.5">
          {visible.map((n) => (
            <li
              key={n.id}
              className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-4 py-3 text-center transition hover:border-gold/40 hover:bg-cream/[0.04]"
            >
              <p className="tnum text-[11px] font-semibold text-cream/40">
                {n.id}
              </p>
              <p className="font-arabic mt-0.5 text-xl leading-snug text-cream" dir="rtl">
                {n.arabic}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-gold">
                {n.transliteration}
              </p>
              <p className="text-xs text-cream/65">{n.meaning}</p>
            </li>
          ))}
        </ul>
      )}

      {!searching && filtered.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-4 py-2.5 text-sm font-semibold text-cream/75 transition hover:border-gold/40 hover:text-gold"
        >
          {expanded ? "Show less" : `Show all 99 names`}
        </button>
      )}
    </section>
  );
}
