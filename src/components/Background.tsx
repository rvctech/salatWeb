import { useMemo } from "react";

/** Deterministic pseudo-random star field so layout is stable across renders. */
const STARS = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin((i + 1) * n) * 10000;
    return x - Math.floor(x);
  };
  return {
    top: `${Math.round(r(12.9898) * 100)}%`,
    left: `${Math.round(r(78.233) * 100)}%`,
    size: 1 + Math.round(r(43.85) * 2),
    delay: `${(r(91.21) * 5).toFixed(2)}s`,
    dur: `${(2.4 + r(4.11) * 3.6).toFixed(2)}s`,
    op: (0.25 + r(7.7) * 0.6).toFixed(2),
  };
});

export default function Background() {
  const stars = useMemo(() => STARS, []);
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* soft colour glows — use CSS variables from current theme */}
      <div
        className="absolute -right-32 -top-40 h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-glow-1), transparent 62%)",
          animation: "glowPulse 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -left-40 top-1/3 h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--color-glow-2), transparent 60%)",
          animation: "glowPulse 16s ease-in-out infinite",
        }}
      />

      {/* geometric islamic lattice */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ opacity: 0.05, color: "var(--color-gold)" }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="khatim"
            width="72"
            height="72"
            patternUnits="userSpaceOnUse"
          >
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="18" y="18" width="36" height="36" />
              <rect
                x="18"
                y="18"
                width="36"
                height="36"
                transform="rotate(45 36 36)"
              />
              <circle cx="36" cy="36" r="7" />
              <path d="M36 0v18M36 54v18M0 36h18M54 36h18" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#khatim)" />
      </svg>

      {/* twinkling stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            backgroundColor: "var(--color-cream)",
            opacity: Number(s.op),
            animation: `twinkle ${s.dur} ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}

      {/* bottom vignette */}
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "linear-gradient(180deg, transparent, var(--color-vignette))",
        }}
      />
    </div>
  );
}
