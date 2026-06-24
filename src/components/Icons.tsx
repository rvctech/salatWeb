import type { ReactElement, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LogoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c2.5 2 4 4.6 4 7.5 0 .5 0 1-.1 1.5" />
      <path d="M4 21h16M6 21v-2a6 6 0 0 1 12 0v2" />
      <path d="M9 9.2A6 6 0 0 0 8 13v6M16 13v6" />
      <path d="M19.5 7.2a2.6 2.6 0 0 1-3 .2 2.7 2.7 0 0 1 2.3-4.6 3.8 3.8 0 0 0 .7 4.4Z" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-6.5-5.4-6.5-10.2A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.8C18.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.3" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function LocateIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 12c0-.5 0-1 .1-1.5l1.7-1.3-1.8-3.1-2 .8a6.7 6.7 0 0 0-2.6-1.5l-.3-2.2H8.5l-.3 2.2A6.7 6.7 0 0 0 5.6 7l-2-.8L1.8 9.2l1.7 1.3c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-1.7 1.3 1.8 3.1 2-.8a6.7 6.7 0 0 0 2.6 1.5l.3 2.2h3l.3-2.2a6.7 6.7 0 0 0 2.6-1.5l2 .8 1.8-3.1-1.7-1.3c.1-.5.1-1 .1-1.5Z" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      <path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.8 9.2-1.4 4.2-4.2 1.4 1.4-4.2 4.2-1.4Z" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3c.6 3.6 1.8 4.8 5.4 5.4-3.6.6-4.8 1.8-5.4 5.4-.6-3.6-1.8-4.8-5.4-5.4C10.2 7.8 11.4 6.6 12 3Z" />
      <path d="M18.5 14c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z" />
    </svg>
  );
}

/* ---------- Prayer icons ---------- */

export function FajrIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19.6 13.6A7.5 7.5 0 0 1 8 18.4" />
      <path d="M15.4 9.2A4.3 4.3 0 0 1 17 12.3" />
      <path d="M3 18h18M5.5 21h13" />
      <path d="M11.5 4.8a3 3 0 0 0 3.7 3.7 2.5 2.5 0 1 1-3.7-3.7Z" />
      <path d="m6.6 5.6.5-.1M8.4 8.4l-.1.5" />
    </svg>
  );
}

export function SunriseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 18h18M5.5 21h13" />
      <path d="M12 4v3M5.6 9.6 7 11M18.4 9.6 17 11M3.5 14.5H5M21 14.5h-1.5" />
      <path d="M8 14.5a4 4 0 0 1 8 0" />
      <path d="m9 6.5 3-2.5 3 2.5" />
    </svg>
  );
}

export function DhuhrIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export function AsrIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="11" r="3.4" />
      <path d="M12 4v1.5M4.8 8.2 6 9M19.2 8.2 18 9M3.5 14.5h5M15.5 14.5h5" />
      <path d="M3 18h18M5.5 21h13" />
    </svg>
  );
}

export function MaghribIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 18h18M5.5 21h13" />
      <path d="M8 18a4 4 0 0 1 8 0" />
      <path d="M12 10v2M5.8 11.8 7 13M18.2 11.8 17 13M3.5 15.5H5M19 15.5h-1.5" />
      <path d="m9 8 3 2 3-2" />
    </svg>
  );
}

export function IshaIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18.5 13.2A6.5 6.5 0 0 1 9.2 19 5.2 5.2 0 1 0 14.8 9a6.4 6.4 0 0 0 3.7 4.2Z" />
      <path d="m16.6 6.4.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4.4-1Z" />
      <path d="M6.5 7.5l.3.7.7.3-.7.3-.3.7-.3-.7-.7-.3.7-.3.3-.7Z" />
    </svg>
  );
}

export function KaabaIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="7" width="16" height="13" rx="1" />
      <path d="M4 11h16" />
      <path d="M7 7.5 9 4h6l2 3.5" />
      <path d="M4 13.5h16" />
      <path d="M9 11v2.5M15 11v2.5" />
    </svg>
  );
}

export const PRAYER_ICONS: Record<string, (p: IconProps) => ReactElement> = {
  Fajr: FajrIcon,
  Sunrise: SunriseIcon,
  Dhuhr: DhuhrIcon,
  Asr: AsrIcon,
  Maghrib: MaghribIcon,
  Isha: IshaIcon,
};
