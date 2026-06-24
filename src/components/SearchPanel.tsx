import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { SearchIcon, LocateIcon, PinIcon } from "./Icons";
import { searchPlaces } from "../lib/api";
import type { LocationInfo, PlaceSuggestion } from "../lib/types";

const QUICK: { name: string; lat: number; lon: number }[] = [
  { name: "Makkah", lat: 21.4225, lon: 39.8262 },
  { name: "Madinah", lat: 24.5247, lon: 39.5692 },
  { name: "Istanbul", lat: 41.0082, lon: 28.9784 },
  { name: "Cairo", lat: 30.0444, lon: 31.2357 },
  { name: "Dubai", lat: 25.2048, lon: 55.2708 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Jakarta", lat: -6.2088, lon: 106.8456 },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (loc: LocationInfo) => void;
  onUseLocation: () => void;
}

export default function SearchPanel({
  open,
  onClose,
  onSelect,
  onUseLocation,
}: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (open) {
      setQ("");
      setItems([]);
      setError(null);
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 3) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const res = await searchPlaces(q);
        if (reqId.current === id) {
          setItems(res);
          setActive(-1);
        }
      } catch {
        if (reqId.current === id)
          setError("Couldn't search places. Check your connection and retry.");
      } finally {
        if (reqId.current === id) setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  function build(it: PlaceSuggestion): LocationInfo {
    return {
      lat: it.lat,
      lon: it.lon,
      label: it.label,
      sublabel: it.sublabel,
      source: "search",
    };
  }

  function onKey(e: React.KeyboardEvent) {
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      const it = items[active];
      if (it) onSelect(build(it));
    }
  }

  const showQuick = q.trim().length < 3;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Find a location"
      icon={<SearchIcon className="h-5 w-5 text-gold" />}
    >
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="Search a city, area or address…"
          className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-cream placeholder:text-cream/35 outline-none transition focus:border-gold/50 focus:bg-white/[0.07]"
        />
      </div>

      <div className="mt-4 max-h-[22rem] overflow-y-auto pr-1">
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-3 px-2 py-3 text-sm text-cream/50">
            <Spinner /> Searching…
          </div>
        )}

        {!loading && !showQuick && items.length === 0 && !error && (
          <p className="px-2 py-6 text-center text-sm text-cream/45">
            No matches. Try a different spelling or city.
          </p>
        )}

        {!loading && items.length > 0 && (
          <ul className="space-y-1">
            {items.map((it, i) => (
              <li key={`${it.lat},${it.lon}-${i}`}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onSelect(build(it))}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active === i ? "bg-gold/15" : "hover:bg-white/5"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold/80 ring-1 ring-white/10">
                    <PinIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-cream">
                      {it.label}
                    </span>
                    {it.sublabel && (
                      <span className="block truncate text-xs text-cream/45">
                        {it.sublabel}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {showQuick && (
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-cream/40">
              Popular cities
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map((c) => (
                <button
                  key={c.name}
                  onClick={() =>
                    onSelect({
                      lat: c.lat,
                      lon: c.lon,
                      label: c.name,
                      source: "search",
                    })
                  }
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left text-sm font-medium text-cream/80 transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-white/8 pt-4">
        <button
          onClick={onUseLocation}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-gold to-gold-soft py-3 font-semibold text-night transition hover:brightness-105 active:scale-[0.98]"
        >
          <LocateIcon className="h-5 w-5" />
          Use my current location
        </button>
      </div>
    </Modal>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-gold"
      style={{ animationDuration: "0.7s" }}
    />
  );
}
