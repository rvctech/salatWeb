import { useEffect, useMemo, useRef, useState } from "react";
import { QiblaIcon, KaabaIcon, LocateIcon } from "./Icons";
import { KAABA, haversineKm } from "../lib/qibla";

interface Props {
  bearing: number;
  lat: number;
  lon: number;
}

interface DeviceOrientationEventExt extends Event {
  webkitCompassHeading?: number;
  alpha?: number | null;
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

export default function Qibla({ bearing, lat, lon }: Props) {
  const [heading, setHeading] = useState<number | null>(null);
  const [active, setActive] = useState(false);
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
      const handler = (e: DeviceOrientationEventExt) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          let h: number | null = e.webkitCompassHeading ?? null;
          if (h == null && e.alpha != null) h = 360 - e.alpha;
          if (h == null || Number.isNaN(h)) return;
          if (last >= 0 && Math.abs(h - last) < 0.5) return;
          last = h;
          setHeading(h);
        });
      };
      evtRef.current =
        "ondeviceorientationabsolute" in window
          ? "deviceorientationabsolute"
          : "deviceorientation";
      handlerRef.current = handler;
      window.addEventListener(evtRef.current, handler as EventListener, true);
      setActive(true);
      setStatus(
        "Hold your device flat and face forward — the Kaaba marks Qibla.",
      );
    } catch {
      setStatus("Unable to read the compass.");
    }
  }

  const facingQibla = (() => {
    if (!active || heading == null) return false;
    const diff = ((bearing - heading + 540) % 360) - 180;
    return Math.abs(diff) <= QIBLA_TOLERANCE;
  })();

  const turnHint = (() => {
    if (!active || heading == null) return "";
    const diff = ((bearing - heading + 540) % 360) - 180;
    const abs = Math.abs(diff);
    const dir = diff > 0 ? "left" : "right";
    if (abs <= QIBLA_TOLERANCE) return "Facing Qibla!";
    return `Rotate ${Math.round(abs)}° ${dir}`;
  })();

  // Buzz once each time the user swings onto Qibla (like onlinecompass.io).
  useEffect(() => {
    const was = wasFacingRef.current;
    wasFacingRef.current = facingQibla;
    if (facingQibla && !was && vibrateOn && "vibrate" in navigator) {
      try {
        navigator.vibrate(200);
      } catch {
        /* ignore */
      }
    }
  }, [facingQibla, vibrateOn]);

  function toggleVibrate() {
    if (!vibrateOn && !("vibrate" in navigator)) {
      // iPhones and most desktops expose no vibration hardware to the web.
      setStatus(
        "Vibration isn't supported on this device or browser — the green ring still shows alignment.",
      );
      return;
    }
    setVibrateOn((v) => {
      try {
        localStorage.setItem(VIBRATE_KEY, v ? "0" : "1");
      } catch {
        /* ignore */
      }
      if (!v) {
        // Instant test buzz so enabling gives immediate feedback.
        try {
          navigator.vibrate(60);
        } catch {
          /* ignore */
        }
      }
      return !v;
    });
  }

  const cardinal = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
    Math.round(bearing / 45) % 8
  ];

  const kaabaColor =
    active && heading != null
      ? facingQibla
        ? "bg-emerald-500 border-emerald-500 text-white"
        : "bg-red-500 border-red-500 text-white"
      : "bg-gold/10 border-gold/40 text-gold";

  const kaabaGlow =
    active && heading != null && facingQibla
      ? "shadow-[0_0_24px_rgba(16,185,129,0.5)]"
      : "";

  const distance = haversineKm(lat, lon, KAABA.lat, KAABA.lon);
  const dialRotation = active && heading != null ? -heading : 0;
  const needleRotation =
    active && heading != null
      ? ((bearing - heading) % 360 + 360) % 360
      : bearing;
  const ticks = useMemo(() => Array.from({ length: 72 }, (_, i) => i * 5), []);
  const spinCls = active ? "duration-150" : "duration-300";

  // SVG arc: track + gold progress from North (top) to Qibla bearing
  const ARC_R = 46;
  const ARC_C = 2 * Math.PI * ARC_R;
  const arcLen = ((((bearing % 360) + 360) % 360) / 360) * ARC_C;

  return (
    <section className="animate-fadeUp rounded-3xl border border-[var(--color-glass-border)] glass p-5 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/30">
            <QiblaIcon className="h-5 w-5" />
          </span>
          <h3 className="font-display text-lg font-semibold text-cream">
            Qibla Direction
          </h3>
        </div>
        <span className="rounded-full bg-[var(--color-glass-bg)] px-3 py-1 text-xs font-medium text-cream/60 ring-1 ring-[var(--color-glass-border)]">
          <span className="tnum">{distance.toLocaleString()}</span> km to Makkah
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-5">
        {/* dial */}
        <div className="relative h-60 w-60 shrink-0 sm:h-[15rem] sm:w-[15rem]">
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
          <div className="absolute inset-[5px] rounded-full border border-[var(--color-glass-border)] bg-[radial-gradient(circle_at_50%_35%,var(--color-glass-bg),transparent_70%)] shadow-[inset_0_2px_18px_rgba(0,0,0,0.35)]" />

          {/* Qibla arc: North -> bearing */}
          <svg viewBox="0 0 100 100" className="absolute inset-[10px]">
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

          {/* rotating compass face: ticks + cardinals + north needle */}
          <div
            className={`absolute inset-[18px] transition-transform ease-out ${spinCls}`}
            style={{ transform: `rotate(${dialRotation}deg)` }}
          >
            {ticks.map((deg) => (
              <span
                key={deg}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `rotate(${deg}deg) translateY(-4.7rem)`,
                  transformOrigin: "0 0",
                }}
              >
                <span
                  className={`block rounded-full ${
                    deg % 90 === 0
                      ? "h-3.5 w-[3px] bg-gold"
                      : deg % 30 === 0
                        ? "h-2.5 w-[2px] bg-cream/60"
                        : deg % 5 === 0
                          ? "h-1.5 w-[1.5px] bg-cream/45"
                          : ""
                  }`}
                />
              </span>
            ))}

            {CARDINALS.map((c) => (
              <span
                key={c.label}
                className="absolute left-1/2 top-1/2 font-display text-[13px] font-bold"
                style={{
                  transform: `rotate(${c.angle}deg) translateY(-3.9rem) rotate(${-c.angle - dialRotation}deg) translateX(-50%)`,
                  transformOrigin: "0 0",
                }}
              >
                <span
                  className={
                    c.label === "N"
                      ? "rounded-md bg-gold px-1.5 py-0.5 text-[11px] text-night shadow-[0_0_10px_rgba(233,201,127,0.7)]"
                      : "text-cream/75"
                  }
                >
                  {c.label}
                </span>
              </span>
            ))}

            {/* magnetic-north marker: small triangle at N */}
            <span
              className="absolute left-1/2 top-1/2 h-0 w-0"
              style={{ transform: "rotate(0deg)" }}
            >
              <span className="absolute -left-[5px] -top-[4.7rem] h-0 w-0 border-x-[5px] border-b-[7px] border-x-transparent border-b-red-400/90" />
            </span>
          </div>

          {/* Qibla needle — ornate Islamic arrow: spearhead + crescent tip, fluted shaft, crescent tail */}
          <div className="absolute inset-[18px]">
            <div
              className={`h-full w-full transition-transform ease-out ${spinCls}`}
              style={{
                transform: `rotate(${needleRotation}deg)`,
                filter: "drop-shadow(0 0 10px rgba(233,201,127,0.65))",
              }}
            >
              <div className="absolute bottom-1/2 left-1/2 top-[0.45rem] w-[10px] -translate-x-1/2">
                {/* spearhead */}
                <span
                  className="absolute left-1/2 top-0 h-[26px] w-[16px] -translate-x-1/2 bg-linear-to-t from-gold via-gold-soft to-gold-soft"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 55%, 50% 100%, 0% 55%)",
                  }}
                  aria-hidden="true"
                />
                <span
                  className="absolute left-1/2 top-[7px] h-[12px] w-[6px] -translate-x-1/2 bg-night/25"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 55%, 50% 100%, 0% 55%)",
                  }}
                  aria-hidden="true"
                />
                {/* crescent tip */}
                <span className="absolute -top-[7px] left-1/2 h-[11px] w-[11px] -translate-x-1/2 rounded-full border-[2px] border-gold-soft bg-transparent shadow-[0_0_8px_rgba(233,201,127,0.9)]" />
                {/* fluted shaft */}
                <div className="absolute inset-x-[2px] bottom-[1.5rem] top-[26px] overflow-hidden rounded-full border border-gold-soft/70 bg-linear-to-t from-gold/30 via-gold to-gold-soft">
                  <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-night/30" />
                  <span className="absolute inset-y-0 left-[1px] w-[1px] bg-white/50" />
                </div>
                {/* collar */}
                <span className="absolute bottom-[1.15rem] left-1/2 h-[7px] w-[12px] -translate-x-1/2 rounded-full border border-gold-soft/80 bg-gold/80" />
                {/* crescent tail counterweight */}
                <span className="absolute bottom-[0.05rem] left-1/2 flex h-[15px] w-[15px] -translate-x-1/2 items-center justify-center rounded-full border border-tealglow/60 bg-tealglow/20">
                  <span className="block h-[7px] w-[7px] rounded-full bg-gold" />
                </span>
              </div>
            </div>
          </div>

          {/* center cap */}
          <div
            className={`absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-xl transition-colors duration-300 ${
              active && heading != null && facingQibla
                ? "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_28px_rgba(16,185,129,0.6)]"
                : "border-gold/60 bg-[var(--color-surface-strong)] text-gold"
            }`}
          >
            <KaabaIcon className="h-7 w-7" />
            {active && heading != null && facingQibla && (
              <span className="absolute inset-0 animate-ping rounded-full border border-emerald-400 opacity-40" />
            )}
          </div>
        </div>

        {/* readout */}
        <div className="flex flex-1 flex-col items-center gap-3 sm:items-end">
          <div className="flex flex-col items-center sm:items-end">
            <p className="tnum font-display text-4xl font-bold text-cream sm:text-5xl">
              {Math.round(bearing)}
              <span className="text-2xl text-gold">°</span>
            </p>
            <p className="mt-1 text-sm font-medium text-cream/70">
              {cardinal} <span className="text-cream/40">· from North</span>
              {active && heading != null && (
                <span className="tnum block text-xs text-cream/55">
                  Qibla {Math.round(bearing)}° · You {Math.round(heading)}°
                </span>
              )}
            </p>
            <div
              className={`mt-3 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${kaabaColor} ${kaabaGlow}`}
            >
              {active && heading != null
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
          </div>
          {status && (
            <p className="max-w-[16rem] text-center text-xs leading-relaxed text-cream/65 sm:text-right">
              {status}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
