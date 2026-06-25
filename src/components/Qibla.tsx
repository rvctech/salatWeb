import { useEffect, useRef, useState } from "react";
import { CompassIcon, KaabaIcon, LocateIcon } from "./Icons";
import { KAABA } from "../lib/api";

interface Props {
  bearing: number;
  lat: number;
  lon: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

const CARDINALS = [
  { label: "N", angle: 0 },
  { label: "E", angle: 90 },
  { label: "S", angle: 180 },
  { label: "W", angle: 270 },
];

const RADIUS = 5.4; // rem — needle / tick radius within the dial

export default function Qibla({ bearing, lat, lon }: Props) {
  const [heading, setHeading] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const handlerRef = useRef<((e: any) => void) | null>(null);
  const evtRef = useRef<string>("deviceorientation");

  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        window.removeEventListener(evtRef.current, handlerRef.current, true);
      }
    };
  }, []);

  async function enableCompass() {
    const DOE = (window as any).DeviceOrientationEvent;
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
      const handler = (e: any) => {
        let h: number | null = e.webkitCompassHeading;
        if (h == null && e.alpha != null) h = 360 - e.alpha;
        if (h != null && !Number.isNaN(h)) setHeading(h);
      };
      evtRef.current =
        "ondeviceorientationabsolute" in window
          ? "deviceorientationabsolute"
          : "deviceorientation";
      handlerRef.current = handler;
      window.addEventListener(evtRef.current, handler, true);
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
    return Math.abs(diff) < 10;
  })();

  const turnHint = (() => {
    if (!active || heading == null) return "";
    const diff = ((bearing - heading + 540) % 360) - 180;
    const abs = Math.abs(diff);
    const dir = diff > 0 ? "left" : "right";
    if (abs < 10) return "Facing Qibla!";
    return `Rotate ${Math.round(abs)}° ${dir}`;
  })();

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
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);

  return (
    <section className="animate-fadeUp rounded-3xl border border-white/10 glass p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CompassIcon className="h-5 w-5 text-gold" />
          <h3 className="font-display text-lg font-semibold text-cream">
            Qibla Direction
          </h3>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-cream/60 ring-1 ring-white/10">
          <span className="tnum">{distance.toLocaleString()}</span> km to Makkah
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
        {/* dial */}
        <div className="relative h-[13.5rem] w-[13.5rem] shrink-0">
          <div className="absolute inset-0 rounded-full border border-white/10 bg-linear-to-b from-white/[0.06] to-transparent shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]" />

          {/* rotating compass face */}
          <div
            className="absolute inset-2 transition-transform duration-200 ease-out"
            style={{ transform: `rotate(${dialRotation}deg)` }}
          >
            {ticks.map((deg) => (
              <span
                key={deg}
                className="absolute left-1/2 top-1/2 origin-top"
                style={{
                  transform: `rotate(${deg}deg) translateY(-${RADIUS}rem)`,
                }}
              >
                <span
                  className={`block w-[2px] rounded-full ${
                    deg % 90 === 0
                      ? "h-3 bg-gold/70"
                      : deg % 30 === 0
                        ? "h-2 bg-cream/40"
                        : "h-1.5 bg-cream/20"
                  }`}
                />
              </span>
            ))}

            {CARDINALS.map((c) => (
              <span
                key={c.label}
                className="absolute left-1/2 top-1/2 font-display text-sm font-bold"
                style={{
                  transform: `rotate(${c.angle}deg) translateY(-4.85rem) rotate(${
                    -c.angle - dialRotation
                  }deg)`,
                }}
              >
                <span className={c.label === "N" ? "text-gold" : "text-cream/55"}>
                  {c.label}
                </span>
              </span>
            ))}

            {/* qibla needle */}
            <div className="absolute left-1/2 top-1/2 h-0 w-0">
              <div
                className="absolute"
                style={{
                  bottom: 0,
                  left: "-1.5px",
                  width: "3px",
                  height: `${RADIUS}rem`,
                  transformOrigin: "bottom center",
                  transform: `rotate(${bearing}deg)`,
                }}
              >
                <div className="h-full w-full rounded-full bg-linear-to-t from-gold/20 to-gold shadow-[0_0_14px_rgba(233,201,127,0.8)]" />
                <span className="absolute -left-[3px] -top-[5px] h-2.5 w-2.5 rounded-full bg-gold shadow-[0_0_10px_rgba(233,201,127,0.9)]" />
              </div>
            </div>
          </div>

          {/* center kaaba (fixed, on top) */}
          <div className="absolute left-1/2 top-1/2 z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-night/85 text-gold shadow-lg">
            <KaabaIcon className="h-6 w-6" />
          </div>
        </div>

        {/* readout */}
        <div className="flex flex-1 flex-col items-center gap-3 sm:items-end">
          <div className="flex flex-col items-center sm:items-end">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300 ${kaabaColor} ${kaabaGlow}`}
            >
              <KaabaIcon className="h-8 w-8" />
            </div>
            <p className="mt-2 text-sm text-cream/55">
              {active && heading != null
                ? facingQibla
                  ? "Qibla found"
                  : turnHint
                : `${cardinal} · from North`}
            </p>
          </div>
          <button
            onClick={enableCompass}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20 active:scale-95"
          >
            <LocateIcon className="h-4 w-4" />
            {active ? "Compass on" : "Use live compass"}
          </button>
          {status && (
            <p className="max-w-[16rem] text-center text-xs leading-relaxed text-cream/50 sm:text-right">
              {status}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
