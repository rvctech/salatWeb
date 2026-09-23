import { useEffect, useState } from "react";
import Modal from "./Modal";
import { GearIcon } from "./Icons";
import { PRAYER_METHODS, THEMES } from "../lib/api";
import { playAdhan, playPing, stopAdhan } from "../lib/notify";
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
      className="grid gap-1 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`min-h-[44px] rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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
  const [previewFailed, setPreviewFailed] = useState(false);

  // Never leave the Adhan playing behind a closed panel.
  useEffect(() => {
    if (!open) stopAdhan();
  }, [open ]);

  async function previewSound() {
    setPreviewFailed(false);
    stopAdhan();
    const ok =
      settings.alertSound === "adhan"
        ? await playAdhan()
        : await playPing(0.15);
    if (!ok) setPreviewFailed(true);
  }

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
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/60">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onChange({ ...settings, theme: t.id as ThemeId })}
                className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
                  settings.theme === t.id
                    ? "border-gold/60 bg-gold/10"
                    : "border-[var(--color-glass-border)] hover:border-cream/25 hover:bg-cream/5"
                }`}
              >
                <span
                  className={`h-8 w-8 rounded-full ring-2 transition ${
                    settings.theme === t.id
                      ? "ring-gold ring-offset-2 ring-offset-deep"
                      : "ring-cream/15 group-hover:ring-cream/30"
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
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/60">
            Calculation method
          </label>
          <div className="relative">
            <select
              value={settings.method}
              onChange={(e) =>
                onChange({ ...settings, method: Number(e.target.value) })
              }
              style={{ colorScheme: "var(--color-scheme)" }}
              className="w-full appearance-none rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-3.5 py-3 pr-10 text-cream outline-none transition focus:border-gold/50"
            >
              {PRAYER_METHODS.map((m) => (
                <option
                  key={m.id}
                  value={m.id}
                  style={{
                    background: "var(--color-select-bg)",
                    color: "var(--color-cream)",
                  }}
                >
                  {m.name} — {m.region}
                </option>
              ))}
            </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/60">
              ▾
            </span>
          </div>
          {method && (
            <p className="mt-1.5 text-xs text-cream/60">{method.region}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/60">
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
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/60">
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
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/60">
            Prayer alert sound
          </label>
          <Segmented
            value={settings.alertSound}
            onChange={(v) => {
              stopAdhan();
              setPreviewFailed(false);
              onChange({ ...settings, alertSound: v });
            }}
            options={[
              { value: "ping", label: "Soft ping" },
              { value: "adhan", label: "Adhan" },
            ]}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => void previewSound()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20 active:scale-95"
            >
              Test {settings.alertSound === "adhan" ? "Adhan" : "ping"}
            </button>
            {previewFailed && (
              <span className="text-xs text-danger">
                Couldn't play sound — check volume and silent mode.
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-cream/60">
            {settings.alertSound === "adhan"
              ? "Streams the call to prayer when alerts fire; falls back to ping offline."
              : "Gentle two-tone chime, works fully offline."}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-cream/60">
            Hijri date adjustment
          </label>
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-4 py-3">
            <div>
              <p className="text-sm text-cream">Adjust date</p>
              <p className="text-xs text-cream/60">
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
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                  settings.hijriOffset <= -5
                    ? "border-[var(--color-glass-border)] text-cream/20"
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
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                  settings.hijriOffset >= 5
                    ? "border-[var(--color-glass-border)] text-cream/20"
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

        <p className="rounded-xl bg-[var(--color-glass-bg)] px-3 py-2.5 text-xs leading-relaxed text-cream/60">
          Methods differ in Fajr/Isha angle conventions. Choose the one followed
          by your local mosque or community for the most accurate times.
        </p>
      </div>
    </Modal>
  );
}
