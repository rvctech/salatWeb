import { useMemo, useState } from "react";
import { SearchIcon } from "./Icons";
import { DUAS, DUA_CATEGORIES } from "../lib/duas";

export default function DuaLibrary() {
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DUAS.filter((d) => {
      if (category !== "All" && !d.categories.includes(category)) return false;
      if (!q) return true;
      return (
        d.transliteration.toLowerCase().includes(q) ||
        d.translation.toLowerCase().includes(q) ||
        d.arabic.includes(query.trim())
      );
    });
  }, [category, query]);

  const searching = query.trim().length > 0;

  return (
    <section
      aria-label="Dua library"
      className="animate-fadeUp rounded-3xl border border-[var(--color-glass-border)] glass p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-cream">
          Daily Duas
        </h3>
        <span className="shrink-0 rounded-full bg-[var(--color-glass-bg)] px-3 py-1 text-xs font-medium text-cream/60 ring-1 ring-[var(--color-glass-border)]">
          <span className="tnum">{searching ? filtered.length : DUAS.length}</span> duas
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by occasion">
        {["All", ...DUA_CATEGORIES].map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={`min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              category === c
                ? "border-gold/60 bg-gold/15 text-gold"
                : "border-[var(--color-glass-border)] text-cream/65 hover:text-cream"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <label htmlFor="dua-search" className="sr-only">
          Search duas
        </label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/60" />
        <input
          id="dua-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search duas…"
          autoComplete="off"
          className="min-h-[44px] w-full rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] py-2.5 pl-11 pr-4 text-sm text-cream placeholder:text-cream/60 outline-none transition focus:border-gold/50"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-[var(--color-glass-bg)] px-4 py-3 text-center text-sm text-cream/60">
          No duas match “{query}”.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {filtered.map((d) => (
            <li
              key={d.id}
              className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-4 py-3.5"
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                {d.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold/80 ring-1 ring-gold/25"
                  >
                    {c}
                  </span>
                ))}
                {d.repeat && (
                  <span className="tnum rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cream/60">
                    {d.repeat}
                  </span>
                )}
              </div>
              <p className="font-arabic text-xl leading-relaxed text-cream" dir="rtl" lang="ar">
                {d.arabic}
              </p>
              <p className="mt-1.5 text-[13px] font-medium italic text-gold/90">
                {d.transliteration}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-cream/70">
                {d.translation}
              </p>
              <p className="mt-1.5 text-[11px] text-cream/40">{d.reference}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
