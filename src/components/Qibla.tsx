import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { QiblaIcon, KaabaIcon, LocateIcon, ExpandIcon, CloseIcon } from "./Icons";
import { KAABA, haversineKm } from "../lib/qibla";
import { vibrateNow, vibrateSupported } from "../lib/notify";

interface Props {
  bearing: number;
  lat: number;
  lon: number;
  style?: CSSProperties;
}

interface DeviceOrientationEventExt extends Event {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
  alpha?: number | null;
  absolute?: boolean | null;
}

interface DeviceOrientationEventConstructor {
  requestPermission?: () => Promise<string>;
}

const CARDINALS = [
  { label: "N", angle: 0 },
  { label: "E", angle: 90 },
  { label: "S", angle: 180 },
  { label: "W", angle: 270 },
];



const QIBLA_TOLERANCE = 5; // deg — matches onlinecompass.io behavior
const VIBRATE_KEY = "salat.qibla.vibrate";
const OFFSET_KEY = "salat.qibla.offset";
const COMPASS_HINT =
  "Hold your device flat and face forward — the Kaaba marks Qibla.";

function loadOffset(): number {
  try {
    const v = Number(localStorage.getItem(OFFSET_KEY));
    return Number.isFinite(v) ? Math.max(-30, Math.min(30, v)) : 0;
  } catch {
    return 0;
  }
}

/* Geometry is expressed in % of the dial face (plus cqw for stroke text),
 * so the same component renders crisply at card size and fullscreen. */
const TICK_DEGS = Array.from({ length: 36 }, (_, i) => i * 10);
const TICK_R = 36.8;
const CARDINAL_R = 30.6;

function faceXY(deg: number, r: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [50 + r * Math.sin(rad), 50 - r * Math.cos(rad)];
}

/* Live calibration verdict: iOS reports heading accuracy in degrees
 * (negative = uncalibrated); elsewhere we fall back to signal steadiness. */
function CalibrationBadge({
  compassOn,
  accuracy,
  steady,
}: {
  compassOn: boolean;
  accuracy: number | null;
  steady: boolean | null;
}) {
  if (!compassOn) return null;
  let tone = "border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/60";
  let text = "Reading sensors…";
  if (accuracy != null) {
    if (accuracy < 0) {
      tone = "border-red-400/40 bg-danger-soft text-danger";
      text = "Uncalibrated — do the figure-8 above";
    } else if (accuracy <= 10) {
      tone =
        "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
      text = `Calibrated · accurate to ±${Math.round(accuracy)}°`;
    } else {
      tone = "border-amber-400/40 bg-amber-400/10 text-amber-200";
      text = `Rough · ±${Math.round(accuracy)}° — keep waving`;
    }
  } else if (steady != null) {
    if (steady) {
      tone =
        "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
      text = "Steady signal — compass looks calibrated";
    } else {
      tone = "border-amber-400/40 bg-amber-400/10 text-amber-200";
      text = "Signal jumpy — wave the figure-8 above";
    }
  }
  return (
    <p
      role="status"
      className={`rounded-2xl border px-4 py-2.5 text-center text-[13px] font-semibold transition ${tone}`}
    >
      {text}
    </p>
  );
}

interface DialProps {
  bearing: number;
  dialRotation: number;
  needleRotation: number;
  facingQibla: boolean;
  compassOn: boolean;
  className?: string;
}

function QiblaDial({
  bearing,
  dialRotation,
  needleRotation,
  facingQibla,
  compassOn,
  className = "",
}: DialProps) {
  const spinCls = compassOn ? "duration-150" : "duration-300";
  // SVG arc: track + gold progress from North (top) to Qibla bearing
  const ARC_R = 46;
  const ARC_C = 2 * Math.PI * ARC_R;
  const arcLen = ((((bearing % 360) + 360) % 360) / 360) * ARC_C;
  return (
    <div
      className={`relative aspect-square w-full shrink-0 [container-type:inline-size] ${className}`}
    >
      {/* ambient glow behind dial */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(233,201,127,0.14), transparent 65%)",
        }}
      />
      {/* bezel — turns green on alignment, like onlinecompass.io */}
      <div
        className={`absolute inset-0 rounded-full border-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] transition-colors duration-300 ${
          facingQibla
            ? "border-emerald-400 shadow-[0_0_32px_rgba(16,185,129,0.55)]"
            : "border-gold/20"
        }`}
      />
      <div className="absolute inset-[2%] rounded-full border border-[var(--color-glass-border)] bg-[radial-gradient(circle_at_50%_35%,var(--color-glass-bg),transparent_70%)] shadow-[inset_0_2px_18px_rgba(0,0,0,0.35)]" />

      {/* Qibla arc: North -> bearing */}
      <svg viewBox="0 0 100 100" className="absolute inset-[4%]">
        <circle
          cx="50"
          cy="50"
          r={ARC_R}
          fill="none"
          strokeWidth="2.5"
          className="stroke-cream/25"
        />
        <circle
          cx="50"
          cy="50"
          r={ARC_R}
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${arcLen} ${ARC_C}`}
          transform="rotate(-90 50 50)"
          style={{ filter: "drop-shadow(0 0 4px rgba(233,201,127,0.8))" }}
        />
      </svg>

      {/* rotating compass face: ticks + cardinals + north pip */}
      <div
        className={`absolute inset-[7.5%] transition-transform ease-out ${spinCls}`}
        style={{ transform: `rotate(${dialRotation}deg)` }}
      >
        {TICK_DEGS.map((deg) => {
          const [x, y] = faceXY(deg, TICK_R);
          return (
            <span
              key={deg}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%,-50%) rotate(${deg}deg)`,
              }}
            >
              <span
                className={`block rounded-full ${
                  deg % 90 === 0
                    ? "h-[5.8cqw] w-[1.2cqw] bg-gold"
                    : "h-[2.8cqw] w-[0.7cqw] bg-cream/35"
                }`}
              />
            </span>
          );
        })}

        {CARDINALS.map((c) => {
          const [x, y] = faceXY(c.angle, CARDINAL_R);
          return (
            <span
              key={c.label}
              className="absolute font-display"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%,-50%)",
              }}
            >
              <span
                className="block"
                style={{ transform: `rotate(${-dialRotation}deg)` }}
              >
                <span
                  className={
                    c.label === "N"
                      ? "text-[5cqw] font-bold text-gold"
                      : "text-[5cqw] font-medium text-cream/50"
                  }
                >
                  {c.label}
                </span>
              </span>
            </span>
          );
        })}
      </div>

      {/* Qibla needle — modern navigation arrow pointing at Makkah */}
      <div className="absolute inset-[7.5%]">
        <div
          className={`h-full w-full transition-transform ease-out ${spinCls}`}
          style={{
            transform: `rotate(${needleRotation}deg)`,
            filter: "drop-shadow(0 0 8px rgba(233,201,127,0.55))",
          }}
        >
          {/* tapered pointer: tip at 6%, base at center */}
          <span
            className="absolute left-[46%] top-[6%] h-[44%] w-[8%] bg-linear-to-t from-gold/70 via-gold to-gold-soft"
            style={{
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            }}
            aria-hidden="true"
          />
          {/* Kaaba tip marker */}
          <span className="absolute left-1/2 top-[2.5%] flex aspect-square w-[9%] -translate-x-1/2 items-center justify-center rounded-full border-2 border-gold-soft bg-[var(--color-surface-strong)] shadow-[0_0_10px_rgba(233,201,127,0.8)]">
            <KaabaIcon style={{ width: "62%", height: "62%" }} />
          </span>
          {/* short counterweight tail */}
          <span className="absolute left-[48.75%] top-[50%] h-[11%] w-[2.5%] rounded-full bg-cream/25" />
        </div>
      </div>

      {/* center cap */}
      <div
        className={`absolute left-1/2 top-1/2 z-10 flex h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-xl transition-colors duration-300 ${
          facingQibla
            ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_28px_rgba(16,185,129,0.6)]"
            : "border-gold/50 bg-[var(--color-surface-strong)] text-gold"
        }`}
      >
        <KaabaIcon style={{ width: "50%", height: "50%" }} />
        {facingQibla && (
          <span className="absolute inset-0 animate-ping rounded-full border border-emerald-400 opacity-40" />
        )}
      </div>
    </div>
  );
}

export default function Qibla({ bearing, lat, lon, style }: Props) {
  const [heading, setHeading] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  // iOS reports heading accuracy in degrees (negative = uncalibrated).
  // Android exposes nothing, so we derive a steadiness verdict instead.
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [steady, setSteady] = useState<boolean | null>(null);
  const [offset, setOffsetState] = useState<number>(() => loadOffset());
  const samplesRef = useRef<number[]>([]);
  const steadyRef = useRef<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [vibrateOn, setVibrateOn] = useState(() => {
    try {
      return localStorage.getItem(VIBRATE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const handlerRef = useRef<((e: DeviceOrientationEventExt) => void) | null>(null);
  const evtRef = useRef<string>("deviceorientation");
  const wasFacingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        window.removeEventListener(evtRef.current, handlerRef.current as EventListener, true);
      }
    };
  }, []);

  async function enableCompass() {
    const DOE = window.DeviceOrientationEvent as DeviceOrientationEventConstructor | undefined;
    if (!DOE) {
      setStatus("Compass sensors aren't available on this device.");
      return;
    }
    try {
      if (typeof DOE.requestPermission === "function") {
        const res = await DOE.requestPermission();
        if (res !== "granted") {
          setStatus("Compass permission was denied.");
          return;
        }
      }
      // Throttle sensor stream: at most one state update per animation frame,
      // and drop sub-degree jitter.
      let raf = 0;
      let last = -1;
      let warned = false;
      const handler = (e: DeviceOrientationEventExt) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          // webkitCompassHeading (iOS) is always Earth-referenced. Raw alpha
          // is only a compass when the event is absolute — a gyro-relative
          // alpha measures an arbitrary starting pose, and steering the
          // needle by it points Qibla the wrong way. Reject explicitly
          // non-absolute readings instead of trusting them.
          let h: number | null = e.webkitCompassHeading ?? null;
          if (h == null && e.absolute !== false && e.alpha != null) {
            h = (360 - e.alpha) % 360;
          }
          if (h == null || Number.isNaN(h)) {
            // Uncalibrated / relative sensors: say so once instead of
            // freezing on a misleading arrow.
            if (!warned) {
              warned = true;
              setStatus(
                "Compass isn't calibrated — wave your phone in a figure-8 until it settles, then re-enable it.",
              );
            }
            return;
          }
          h = ((h % 360) + 360) % 360;
          if (warned) {
            warned = false;
            setStatus(COMPASS_HINT);
          }
          if (last >= 0 && Math.abs(h - last) < 0.5) return;
          last = h;
          setHeading(h);
          // iOS accuracy (degrees, negative = uncalibrated).
          const acc = e.webkitCompassAccuracy;
          setAccuracy(
            typeof acc === "number" && Number.isFinite(acc) ? acc : null,
          );
          // Android steadiness: max deviation of the last ~15 accepted
          // samples from their circular mean. Under 4° = steady sensor.
          const s = samplesRef.current;
          s.push(h);
          if (s.length > 15) s.shift();
          if (s.length >= 8) {
            const rad = s.map((d) => (d * Math.PI) / 180);
            const mx = rad.reduce((a, d) => a + Math.sin(d), 0) / s.length;
            const my = rad.reduce((a, d) => a + Math.cos(d), 0) / s.length;
            const mean = Math.atan2(mx, my);
            const dev = Math.max(
              ...s.map((d) => {
                const dd = Math.abs(d - (mean * 180) / Math.PI);
                return dd > 180 ? 360 - dd : dd;
              }),
            );
            const isSteady = dev < 4;
            if (steadyRef.current !== isSteady) {
              steadyRef.current = isSteady;
              setSteady(isSteady);
            }
          }
        });
      };
      evtRef.current =
        "ondeviceorientationabsolute" in window
          ? "deviceorientationabsolute"
          : "deviceorientation";
      handlerRef.current = handler;
      window.addEventListener(evtRef.current, handler as EventListener, true);
      setActive(true);
      setStatus(COMPASS_HINT);
    } catch {
      setStatus("Unable to read the compass.");
    }
  }

  function setOffset(v: number) {
    const clamped = Math.max(-30, Math.min(30, Math.round(v)));
    setOffsetState(clamped);
    try {
      localStorage.setItem(OFFSET_KEY, String(clamped));
    } catch {
      /* ignore */
    }
  }

  // Sensor heading corrected by the manual calibration offset.
  // Every readout below derives from this — never the raw heading.
  const adjHeading =
    heading == null ? null : ((heading + offset) % 360 + 360) % 360;
  const compassOn = active && adjHeading != null;

  const facingQibla = (() => {
    if (!compassOn || adjHeading == null) return false;
    const diff = ((bearing - adjHeading + 540) % 360) - 180;
    return Math.abs(diff) <= QIBLA_TOLERANCE;
  })();

  const turnHint = (() => {
    if (!compassOn || adjHeading == null) return "";
    const diff = ((bearing - adjHeading + 540) % 360) - 180;
    const abs = Math.abs(diff);
    const dir = diff > 0 ? "left" : "right";
    if (abs <= QIBLA_TOLERANCE) return "Facing Qibla!";
    return `Rotate ${Math.round(abs)}° ${dir}`;
  })();

  // Buzz once each time the user swings onto Qibla (like onlinecompass.io).
  useEffect(() => {
    const was = wasFacingRef.current;
    wasFacingRef.current = facingQibla;
    if (facingQibla && !was && vibrateOn) {
      vibrateNow(200);
    }
  }, [facingQibla, vibrateOn]);

  function toggleVibrate() {
    if (!vibrateOn && !vibrateSupported()) {
      // iPhones and most desktops expose no vibration hardware to the web,
      // and the API is hidden on insecure (http) pages.
      setStatus(
        "Vibration isn't supported on this device or browser — the green ring still shows alignment.",
      );
      return;
    }
    // Keep the updater pure (StrictMode double-invokes impure ones):
    // side effects live outside setVibrateOn.
    const next = !vibrateOn;
    setVibrateOn(next);
    try {
      localStorage.setItem(VIBRATE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (next) {
      // Instant test buzz so enabling gives immediate feedback.
      if (vibrateNow(60)) {
        setStatus("Buzz on — you'll feel it when facing Qibla.");
      } else {
        setStatus(
          "Couldn't trigger vibration on this device — the green ring still shows alignment.",
        );
      }
    }
  }

  const cardinal = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
    Math.round(bearing / 45) % 8
  ];

  const kaabaColor =
    compassOn
      ? facingQibla
        ? "bg-emerald-500 border-emerald-500 text-white"
        : "bg-red-500 border-red-500 text-white"
      : "bg-gold/10 border-gold/40 text-gold";

  const kaabaGlow =
    compassOn && facingQibla
      ? "shadow-[0_0_24px_rgba(16,185,129,0.5)]"
      : "";

  const distance = haversineKm(lat, lon, KAABA.lat, KAABA.lon);
  const dialRotation = compassOn && adjHeading != null ? -adjHeading : 0;
  const needleRotation =
    compassOn && adjHeading != null
      ? ((bearing - adjHeading) % 360 + 360) % 360
      : bearing;

  // Overlays (fullscreen + calibration): lock body scroll + close on Escape.
  useEffect(() => {
    if (!expanded && !calibrating) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        setCalibrating(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded, calibrating]);

  return (
    <>
    <section
      id="sec-qibla"
      style={style}
      className="animate-fadeUp scroll-mt-32 rounded-3xl border border-[var(--color-glass-border)] glass p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/30">
            <QiblaIcon className="h-5 w-5" />
          </span>
          <h3 className="font-display text-lg font-semibold text-cream">
            Qibla Direction
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-glass-bg)] px-3 py-1 text-xs font-medium text-cream/60 ring-1 ring-[var(--color-glass-border)]">
            <span className="tnum">{distance.toLocaleString()}</span> km to Makkah
          </span>
          <button
            onClick={() => setExpanded(true)}
            aria-label="Open fullscreen compass"
            title="Fullscreen compass"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/70 transition hover:border-gold/40 hover:text-gold"
          >
            <ExpandIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-5">
        {/* dial — scalable component (see QiblaDial above) */}
        <QiblaDial
          bearing={bearing}
          dialRotation={dialRotation}
          needleRotation={needleRotation}
          facingQibla={facingQibla}
          compassOn={compassOn}
          className="w-44 sm:w-52"
        />
        {/* readout */}
        <div className="flex flex-1 flex-col items-center gap-3 sm:items-end">
          <div className="flex flex-col items-center sm:items-end">
            <p className="tnum font-display text-3xl font-bold text-cream sm:text-4xl">
              {Math.round(bearing)}
              <span className="text-xl text-gold">°</span>
            </p>
            <p className="mt-1 text-sm font-medium text-cream/70">
              {cardinal} <span className="text-cream/40">· from North</span>
              {compassOn && adjHeading != null && (
                <span className="tnum block text-xs text-cream/55">
                  Qibla {Math.round(bearing)}° · You {Math.round(adjHeading)}°
                  {accuracy != null && accuracy >= 0 && ` · ±${Math.round(accuracy)}°`}
                  {offset !== 0 &&
                    ` · ${offset > 0 ? "+" : ""}${offset}° adj`}
                </span>
              )}
            </p>
            <div
              className={`mt-3 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${kaabaColor} ${kaabaGlow}`}
            >
              {compassOn
                ? facingQibla
                  ? "Qibla found — you're aligned"
                  : turnHint
                : "Point the gold arrow to face Makkah"}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <button
              onClick={enableCompass}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20 active:scale-95"
            >
              <LocateIcon className="h-4 w-4" />
              {active ? "Compass on" : "Use live compass"}
            </button>
            <button
              onClick={toggleVibrate}
              aria-pressed={vibrateOn}
              title="Vibrate when facing Qibla"
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                vibrateOn
                  ? "border-gold/40 bg-gold/10 text-gold hover:bg-gold/20"
                  : "border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/60 hover:text-cream"
              }`}
            >
              <span
                aria-hidden="true"
                className={`relative h-4 w-7 rounded-full transition-colors ${vibrateOn ? "bg-gold" : "bg-cream/20"}`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${vibrateOn ? "left-3.5" : "left-0.5"}`}
                />
              </span>
              Buzz
            </button>
            <button
              onClick={() => setCalibrating(true)}
              title="Calibrate the compass"
              className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-4 py-2 text-sm font-semibold text-cream/60 transition hover:text-cream active:scale-95"
            >
              Calibrate
              {offset !== 0 && (
                <span className="tnum rounded-full bg-gold/15 px-1.5 py-px text-[11px] text-gold">
                  {offset > 0 ? "+" : ""}
                  {offset}°
                </span>
              )}
            </button>
          </div>
          {status && (
            <p className="max-w-[16rem] text-center text-xs leading-relaxed text-cream/65 sm:text-right">
              {status}
            </p>
          )}
        </div>
      </div>
    </section>

    {/* Fullscreen compass — rendered as a sibling (not inside the animated
        section) so `position: fixed` isn't trapped by its transform. */}
    {expanded && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Qibla compass fullscreen"
        className="animate-fadeIn fixed inset-0 z-50 flex overflow-y-auto backdrop-blur-md"
        style={{
          background:
            "color-mix(in srgb, var(--color-body-bg) 94%, transparent)",
        }}
      >
        {/* m-auto: centers when content fits, scrolls safely from the top
            when it overflows (plain justify-center would clip the close
            button off-screen on short viewports). */}
        <div className="m-auto flex w-full max-w-lg flex-col items-center gap-3 p-5">
        <div className="flex w-full items-center justify-between">
          <p className="font-display text-lg font-semibold text-cream">
            Qibla Compass
          </p>
          <button
            onClick={() => setExpanded(false)}
            aria-label="Close fullscreen compass"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/70 transition hover:border-gold/40 hover:text-gold"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <QiblaDial
          bearing={bearing}
          dialRotation={dialRotation}
          needleRotation={needleRotation}
          facingQibla={facingQibla}
          compassOn={compassOn}
          className="w-[min(80vw,40dvh,24rem)]"
        />

        <p className="tnum font-display text-4xl font-bold text-cream">
          {Math.round(bearing)}
          <span className="text-2xl text-gold">°</span>{" "}
          <span className="text-lg font-semibold text-cream/60">{cardinal}</span>
        </p>

        <div
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${kaabaColor} ${kaabaGlow}`}
        >
          {compassOn
            ? facingQibla
              ? "Qibla found — you're aligned"
              : turnHint
            : "Point the gold arrow to face Makkah"}
        </div>

        {!compassOn && (
          <button
            onClick={enableCompass}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/20 active:scale-95"
          >
            <LocateIcon className="h-4 w-4" />
            Use live compass
          </button>
        )}
        {status && (
          <p className="max-w-sm text-center text-xs leading-relaxed text-cream/65">
            {status}
          </p>
        )}
        </div>
      </div>
    )}

    {/* Calibration sheet */}
    {calibrating && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Calibrate compass"
        className="animate-fadeIn fixed inset-0 z-50 flex overflow-y-auto backdrop-blur-md"
        style={{
          background:
            "color-mix(in srgb, var(--color-body-bg) 94%, transparent)",
        }}
      >
        <div className="m-auto flex w-full max-w-md flex-col gap-4 p-5">
          <div className="flex w-full items-center justify-between">
            <p className="font-display text-lg font-semibold text-cream">
              Calibrate compass
            </p>
            <button
              onClick={() => setCalibrating(false)}
              aria-label="Close calibration"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] text-cream/70 transition hover:border-gold/40 hover:text-gold"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {!compassOn ? (
            <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-4 text-center">
              <p className="text-sm text-cream/75">
                Turn on the live compass first — calibration needs live
                sensor data.
              </p>
              <button
                onClick={enableCompass}
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition hover:bg-gold/20 active:scale-95"
              >
                <LocateIcon className="h-4 w-4" />
                Use live compass
              </button>
            </div>
          ) : (
            <>
              <ol className="space-y-2.5">
                {[
                  "Hold your phone flat, screen up.",
                  "Trace a figure-8 in the air a few times.",
                  "Hold still — watch the badge below turn green.",
                ].map((step, i) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-4 py-3 text-sm text-cream/85"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[13px] font-bold text-gold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              {/* figure-8 demo */}
              <div
                aria-hidden="true"
                className="flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)]"
              >
                <div className="animate-figure8 flex h-14 w-8 items-center justify-center rounded-lg border-2 border-gold bg-gold/15">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                </div>
              </div>

              <CalibrationBadge
                compassOn={compassOn}
                accuracy={accuracy}
                steady={steady}
              />

              {/* manual fine-tune for stubborn constant bias */}
              <div className="rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] p-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="qibla-offset"
                    className="text-sm font-semibold text-cream"
                  >
                    Manual fine-tune
                  </label>
                  <span className="tnum rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold">
                    {offset > 0 ? "+" : ""}
                    {offset}°
                  </span>
                </div>
                <input
                  id="qibla-offset"
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={offset}
                  onChange={(e) => setOffset(Number(e.target.value))}
                  className="mt-3 w-full accent-gold"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-cream/50">
                  <span>-30°</span>
                  {offset !== 0 ? (
                    <button
                      onClick={() => setOffset(0)}
                      className="font-semibold text-gold hover:underline"
                    >
                      Reset to 0°
                    </button>
                  ) : (
                    <span>
                      Point at a known north, then nudge until the dial agrees
                    </span>
                  )}
                  <span>+30°</span>
                </div>
              </div>

              <button
                onClick={() => setCalibrating(false)}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-linear-to-r from-gold to-gold-soft font-semibold text-night transition hover:brightness-105 active:scale-[0.98]"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
}
