import { useEffect, useState } from "react";
import { dayStr } from "../lib/tracker";
import { playCelebration } from "../lib/notify";

interface Dhikr {
  id: string;
  arabic: string;
  transliteration: string;
  target: number;
}

const ADHKAR: Dhikr[] = [
  { id: "subhan", arabic: "سُبْحَانَ ٱللَّٰهِ", transliteration: "SubhanAllah", target: 33 },
  { id: "hamd", arabic: "ٱلْحَمْدُ لِلَّٰهِ", transliteration: "Alhamdulillah", target: 33 },
  { id: "akbar", arabic: "ٱللَّٰهُ أَكْبَر", transliteration: "Allahu Akbar", target: 34 },
  { id: "istighfar", arabic: "أَسْتَغْفِرُ ٱللَّٰه", transliteration: "Astaghfirullah", target: 100 },
  { id: "tahlil", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰه", transliteration: "La ilaha illa Allah", target: 100 },
  { id: "hawla", arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰه", transliteration: "La hawla wa la quwwata illa billah", target: 100 },
];

const QUICK_TARGETS = [33, 100, 500, 1000, 5000, 10000];
const MAX_TARGET = 100000;

const COUNT_KEY = "salat.dhikr.count";
const TARGET_KEY = "salat.dhikr.target";
const TOTAL_PREFIX = "salat.dhikr.total.";

function totalKey(d = new Date()): string {
  return `${TOTAL_PREFIX}${dayStr(d)}`;
}

function loadNum(key: string): number {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
  } catch {
    return 0;
  }
}

function loadTarget(preset: Dhikr): number {
  try {
    const raw = localStorage.getItem(`${TARGET_KEY}.${preset.id}`);
    const v = Number(raw);
    if (Number.isFinite(v) && v >= 1 && v <= MAX_TARGET) return Math.floor(v);
  } catch {
    /* fall through to default */
  }
  return preset.target;
}

function buzz(pattern: number | number[]) {
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export default function DhikrCounter() {
  const [preset, setPreset] = useState<Dhikr>(ADHKAR[0]);
  const [count, setCount] = useState(() => loadNum(`${COUNT_KEY}.${ADHKAR[0].id}`));
  const [target, setTarget] = useState(() => loadTarget(ADHKAR[0]));
  const [customInput, setCustomInput] = useState("");
  const [total, setTotal] = useState(() => loadNum(totalKey()));
  const [totalDay, setTotalDay] = useState(() => dayStr());
  const [done, setDone] = useState(false);

  // Switching dhikr restores its saved count + target.
  useEffect(() => {
    const saved = loadNum(`${COUNT_KEY}.${preset.id}`);
    const savedTarget = loadTarget(preset);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(saved);
    setTarget(savedTarget);
    setDone(saved >= savedTarget);
    setCustomInput("");
  }, [preset]);

  function persistCount(next: number) {
    try {
      localStorage.setItem(`${COUNT_KEY}.${preset.id}`, String(next));
    } catch {
      /* ignore */
    }
  }

  function applyTarget(next: number) {
    const clamped = Math.max(1, Math.min(MAX_TARGET, Math.floor(next)));
    if (!Number.isFinite(clamped)) return;
    setTarget(clamped);
    try {
      localStorage.setItem(`${TARGET_KEY}.${preset.id}`, String(clamped));
    } catch {
      /* ignore */
    }
    setDone(count >= clamped);
  }

  function addSteps(steps: number) {
    const next = count + steps;
    const added = next - count;
    if (added <= 0) return;
    setCount(next);
    persistCount(next);
    // Daily total — rolls over at midnight.
    const key = totalKey();
    const day = dayStr();
    setTotal((t) => {
      const base = day === totalDay ? t : 0;
      const nt = base + added;
      try {
        localStorage.setItem(key, String(nt));
      } catch {
        /* ignore */
      }
      return nt;
    });
    setTotalDay(day);
    if (!done && next >= target) {
      setDone(true);
      buzz([60, 40, 60]);
      void playCelebration();
    } else if (!done) {
      buzz(10);
    }
  }

  function tap() {
    addSteps(1);
  }

  function stepBack() {
    if (count <= 0) return;
    const next = count - 1;
    setCount(next);
    persistCount(next);
    setDone(next >= target);
  }

  function reset() {
    setCount(0);
    setDone(false);
    persistCount(0);
  }

  function submitCustom() {
    const v = Number(customInput);
    if (Number.isFinite(v) && v >= 1 && v <= MAX_TARGET) applyTarget(v);
  }

  const pct = Math.min(100, (count / target) * 100);

  return (
    <section
      aria-label="Dhikr counter"
      className="animate-fadeUp rounded-3xl border border-[var(--color-glass-border)] glass p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-cream">
          Dhikr Counter
        </h3>
        <span className="shrink-0 rounded-full bg-[var(--color-glass-bg)] px-3 py-1 text-xs font-medium text-cream/60 ring-1 ring-[var(--color-glass-border)]">
          <span className="tnum">{total.toLocaleString()}</span> today
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Choose dhikr">
        {ADHKAR.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={preset.id === d.id}
            onClick={() => setPreset(d)}
            className={`min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              preset.id === d.id
                ? "border-gold/60 bg-gold/15 text-gold"
                : "border-[var(--color-glass-border)] text-cream/65 hover:text-cream"
            }`}
          >
            {d.transliteration}
          </button>
        ))}
      </div>

      <p className="font-arabic mt-4 text-center text-3xl leading-snug text-cream" dir="rtl">
        {preset.arabic}
      </p>
      <p className="mt-1 text-center text-sm text-cream/65">
        {preset.transliteration} · target{" "}
        <span className="tnum font-semibold text-gold">{target.toLocaleString()}</span>
      </p>

      {/* Custom target — for large counts like 5,000 / 10,000 istighfar */}
      <div className="mt-3 rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-cream/60">
          Target
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TARGETS.map((t) => (
            <button
              key={t}
              onClick={() => applyTarget(t)}
              aria-pressed={target === t}
              className={`tnum min-h-[40px] rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                target === t
                  ? "border-gold/60 bg-gold/15 text-gold"
                  : "border-[var(--color-glass-border)] text-cream/65 hover:text-cream"
              }`}
            >
              {t.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <label htmlFor="dhikr-custom-target" className="sr-only">
            Custom target (1–100,000)
          </label>
          <input
            id="dhikr-custom-target"
            type="number"
            min={1}
            max={MAX_TARGET}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCustom();
            }}
            placeholder="Custom, e.g. 7000"
            className="tnum min-h-[44px] w-full rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-3 py-2 text-sm text-cream placeholder:text-cream/40 outline-none transition focus:border-gold/50"
          />
          <button
            onClick={submitCustom}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-night transition hover:brightness-105 active:scale-95"
          >
            Set
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-cream/45">
          Count is saved per dhikr — close the app and continue later.
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <button
          onClick={tap}
          aria-label={done ? `Count, currently ${count}, target reached` : `Count, currently ${count}`}
          className={`tnum flex h-48 w-48 flex-col items-center justify-center rounded-full border-2 font-display transition active:scale-95 ${
            done
              ? "border-emerald-400 bg-emerald-400/15 text-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.4)]"
              : "border-gold/50 bg-linear-to-br from-gold/25 to-gold/5 text-gold shadow-[0_0_40px_-10px_rgba(233,201,127,0.5)] hover:brightness-110"
          }`}
        >
          <span className="text-6xl font-bold tabular-nums">{count.toLocaleString()}</span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-widest opacity-70">
            {done
              ? `target ${target.toLocaleString()} · +${(count - target).toLocaleString()} extra`
              : `of ${target.toLocaleString()} · tap`}
          </span>
        </button>
        <div
          className="track mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-label={`${count} of ${target}`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${
              done ? "bg-emerald-400" : "bg-linear-to-r from-gold/70 to-gold"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={stepBack}
            disabled={count <= 0}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-4 py-2 text-sm font-semibold text-cream/70 transition hover:text-cream disabled:opacity-40"
          >
            −1
          </button>
          <button
            onClick={reset}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-4 py-2 text-sm font-semibold text-cream/70 transition hover:border-gold/40 hover:text-gold"
          >
            Reset
          </button>
        </div>
        {done && (
          <p role="status" className="mt-3 text-sm font-semibold text-emerald-200">
            Target reached — may it be accepted.
            {count > target && (
              <span className="tnum"> +{(count - target).toLocaleString()} beyond target.</span>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
