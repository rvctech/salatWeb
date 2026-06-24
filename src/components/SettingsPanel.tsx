import Modal from "./Modal";
import { GearIcon } from "./Icons";
import { PRAYER_METHODS } from "../lib/api";
import type { Settings } from "../lib/api";

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
              style={{ colorScheme: "dark" }}
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

        <p className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-cream/40">
          Methods differ in Fajr/Isha angle conventions. Choose the one followed
          by your local mosque or community for the most accurate times.
        </p>
      </div>
    </Modal>
  );
}
