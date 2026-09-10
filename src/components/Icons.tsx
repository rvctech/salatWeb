/* eslint-disable react-refresh/only-export-components */
import type { ComponentType, CSSProperties, ReactElement } from "react";
import Mosque from "@mui/icons-material/Mosque";
import Place from "@mui/icons-material/Place";
import Search from "@mui/icons-material/Search";
import MyLocation from "@mui/icons-material/MyLocation";
import Settings from "@mui/icons-material/Settings";
import AccessTime from "@mui/icons-material/AccessTime";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Explore from "@mui/icons-material/Explore";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Close from "@mui/icons-material/Close";
import Check from "@mui/icons-material/Check";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import History from "@mui/icons-material/History";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Nightlight from "@mui/icons-material/Nightlight";
import WbTwilight from "@mui/icons-material/WbTwilight";
import WbSunny from "@mui/icons-material/WbSunny";
import BrightnessMedium from "@mui/icons-material/BrightnessMedium";
import Brightness4 from "@mui/icons-material/Brightness4";
import DarkMode from "@mui/icons-material/DarkMode";

/*
 * Salat Times icon system — Material UI.
 * MUI SvgIcon ships `width/height: 1em` from emotion, which beats Tailwind's
 * layered utilities, so each wrapper translates our `h-N w-N` classes into
 * explicit inline px sizes. Everything else (color, margins) passes through.
 */

export interface IconProps {
  className?: string;
  style?: CSSProperties;
}

type MuiIcon = ComponentType<{
  className?: string;
  style?: CSSProperties;
  fontSize?: "inherit" | "small" | "medium" | "large";
}>;

function mui(Mui: MuiIcon) {
  return function Icon({ className, style }: IconProps): ReactElement {
    const m = className?.match(/h-(\d+(?:\.\d+)?)/);
    const px = m ? Number(m[1]) * 4 : undefined;
    return (
      <Mui
        className={className}
        fontSize="inherit"
        style={
          px ? { width: px, height: px, fontSize: px, ...style } : style
        }
      />
    );
  };
}

/* ---------------- Brand + UI (Material) ---------------- */

export const LogoIcon = mui(Mosque);
export const PinIcon = mui(Place);
export const SearchIcon = mui(Search);
export const LocateIcon = mui(MyLocation);
export const GearIcon = mui(Settings);
export const ClockIcon = mui(AccessTime);
export const CalendarIcon = mui(CalendarMonth);
export const CompassIcon = mui(Explore);
export const ChevronDownIcon = mui(ExpandMore);
export const CloseIcon = mui(Close);
export const CheckIcon = mui(Check);
export const SparkleIcon = mui(AutoAwesome);
export const HistoryIcon = mui(History);
export const ArrowRightIcon = mui(ArrowForward);

/* ---------------- Prayer cycle: dawn → night brightness gradient ---------------- */

export const FajrIcon = mui(Nightlight); // pre-dawn night
export const SunriseIcon = mui(WbTwilight); // sun on the horizon
export const DhuhrIcon = mui(WbSunny); // full midday sun
export const AsrIcon = mui(BrightnessMedium); // afternoon sun, fading
export const MaghribIcon = mui(Brightness4); // setting sun, dim
export const IshaIcon = mui(DarkMode); // night

/* ---------------- No Material equivalent — kept custom ---------------- */
// MUI has no Kaaba glyph (only Mosque/Church/Temple/Synagogue), so the
// inlined Font Awesome Kaaba solid stays (CC BY 4.0 Fort Awesome).
export function KaabaIcon({ className, style }: IconProps): ReactElement {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" className={className} style={style}>
      <path d="M256 51.3L92.8 112.4 247.5 171.1c5.5 2.1 11.5 2.1 17 0L419.2 112.4 256 51.3zM0 129.3c0-20 12.4-37.9 31.1-44.9l208-78c10.9-4.1 22.8-4.1 33.7 0l208 78c18.7 7 31.1 24.9 31.1 44.9l0 36-253.2 96c-1.8.7-3.8.7-5.7 0l-253.2-96 0-36zm0 140l0-52.7 236.1 89.6c12.8 4.9 26.9 4.9 39.7 0l236.1-89.6 0 52.7-128 48.6 0 51.3 128-48.6 0 62.2c0 20-12.4 37.9-31.1 44.9l-208 78c-10.9 4.1-22.8 4.1-33.7 0l-208-78C12.4 420.7 0 402.7 0 382.7l0-62.2 128 48.6 0-51.3-128-48.6zM236.1 410.1c12.8 4.9 26.9 4.9 39.7 0l60.1-22.8 0-51.3-77.2 29.3c-1.8.7-3.8.7-5.7 0l-77.2-29.3 0 51.3 60.1 22.8z" />
    </svg>
  );
}

// MUI has no Qibla-direction glyph — compass ring + needle to a Kaaba
// marker on the NE rim, drawn in our 24px outline language.
export function QiblaIcon({ className, style }: IconProps): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <circle cx="12" cy="12" r="8.5" />
      <rect x="14.4" y="4.7" width="3.8" height="3.8" rx="0.8" fill="currentColor" fillOpacity={0.16} />
      <path d="M14.4 6h3.8" strokeWidth={1.4} />
      <path d="M12 12 15.3 8.1" strokeWidth={2.2} />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M12 12l-2.8 2.8" opacity={0.45} />
    </svg>
  );
}

export const PRAYER_ICONS: Record<string, ComponentType<IconProps>> = {
  Fajr: FajrIcon,
  Sunrise: SunriseIcon,
  Dhuhr: DhuhrIcon,
  Asr: AsrIcon,
  Maghrib: MaghribIcon,
  Isha: IshaIcon,
};
