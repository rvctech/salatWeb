import Modal from "./Modal";
import { GearIcon } from "./Icons";
import { PRAYER_METHODS, THEMES } from "../lib/api";
import type { Settings, ThemeId } from "../lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (s: Settings) => void;
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="grid gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            value === o.value
              ? "bg-gold text-night shadow"
              : "text-cream/65 hover:text-cream"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPanel({
  open,
  onClose,
  settings,
  onChange,
}: Props) {
  const method = PRAYER_METHODS.find((m) => m.id === settings.method);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settings"
      icon={<GearIcon className="h-5 w-5 text-gold" />}
    >
      <div className="space-y-5">
        {/* Theme selector */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/50">
            Theme
          </label>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onChange({ ...settings, theme: t.id as ThemeId })}
                className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
                  settings.theme === t.id
                    ? "border-gold/60 bg-gold/10"
                    : "border-white/8 hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-full ring-2 transition ${
                    settings.theme === t.id
                      ? "ring-gold ring-offset-2 ring-offset-deep"
                      : "ring-white/10 group-hover:ring-white/25"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
                  }}
                />
                <span className="text-[10px] font-medium text-cream/60 leading-tight text-center">
                  {t.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/50">
            Calculation method
          </label>
          <div className="relative">
            <select
              value={settings.method}
              onChange={(e) =>
                onChange({ ...settings, method: Number(e.target.value) })
              }
              style={{ colorScheme: "var(--color-scheme)" }}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 pr-10 text-cream outline-none transition focus:border-gold/50"
            >
              {PRAYER_METHODS.map((m) => (
                <option key={m.id} value={m.id} className="bg-night text-cream">
                  {m.name} — {m.region}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/40">
              ▾
            </span>
          </div>
          {method && (
            <p className="mt-1.5 text-xs text-cream/40">{method.region}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/50">
            Asr calculation
          </label>
          <Segmented
            value={settings.school}
            onChange={(v) => onChange({ ...settings, school: v })}
            options={[
              { value: 0, label: "Standard (Shafi)" },
              { value: 1, label: "Hanafi" },
            ]}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/50">
            Time format
          </label>
          <Segmented
            value={settings.h12 ? "12" : "24"}
            onChange={(v) => onChange({ ...settings, h12: v === "12" })}
            options={[
              { value: "12", label: "12-hour" },
              { value: "24", label: "24-hour" },
            ]}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/50">
            Hijri date adjustment
          </label>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm text-cream">Adjust date</p>
              <p className="text-xs text-cream/50">
                {settings.hijriOffset === 0
                  ? "No adjustment"
                  : `${settings.hijriOffset > 0 ? "+" : ""}${settings.hijriOffset} day${Math.abs(settings.hijriOffset) === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    hijriOffset: Math.max(-5, settings.hijriOffset - 1),
                  })
                }
                disabled={settings.hijriOffset <= -5}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  settings.hijriOffset <= -5
                    ? "border-white/5 text-cream/20"
                    : "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <span className="tnum w-8 text-center text-base font-semibold text-cream">
                {settings.hijriOffset}
              </span>
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    hijriOffset: Math.min(5, settings.hijriOffset + 1),
                  })
                }
                disabled={settings.hijriOffset >= 5}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                  settings.hijriOffset >= 5
                    ? "border-white/5 text-cream/20"
                    : "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <p className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-cream/40">
          Methods differ in Fajr/Isha angle conventions. Choose the one followed
          by your local mosque or community for the most accurate times.
        </p>
      </div>
    </Modal>
  );
}
