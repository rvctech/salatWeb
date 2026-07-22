import {
  PRAYER_ORDER,
  SALAH_ORDER,
  getStatus,
  countdown,
  parseHM,
  formatHM,
  zonedNowMs,
  qiblaBearing,
} from "../lib/api";
import { useNow } from "../hooks/useNow";
import LocationBar from "./LocationBar";
import NextPrayer from "./NextPrayer";
import PrayerCard, { type CardStatus } from "./PrayerCard";
import Qibla from "./Qibla";
import type { LocationInfo, PrayerData } from "../lib/types";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

interface Props {
  data: PrayerData;
  location: LocationInfo;
  h12: boolean;
  hijriOffset: number;
  locating: boolean;
  onSearch: () => void;
  onLocate: () => void;
}

export default function Results({
  data,
  location,
  h12,
  hijriOffset,
  locating,
  onSearch,
  onLocate,
}: Props) {
  const now = useNow(1000);
  const tz = data.timezone;
  const nowMs = zonedNowMs(tz, now);
  const { next: nextSalah, prev: prevSalah } = getStatus(
    SALAH_ORDER,
    data.timings,
    tz,
    nowMs,
  );
  const { next: nextEvent } = getStatus(PRAYER_ORDER, data.timings, tz, nowMs);
  const remaining = countdown(nextSalah.ms - nowMs);
  const span = Math.max(1, nextSalah.ms - prevSalah.ms);
  const progress = clamp((nowMs - prevSalah.ms) / span, 0, 1);
  const nextFormatted = formatHM(nextSalah.h, nextSalah.m, h12);
  const bearing = qiblaBearing(location.lat, location.lon);

  const isTomorrow = nextSalah.dayOffset > 0;

  return (
    <div className="space-y-5">
      <LocationBar
        location={location}
        data={data}
        now={now}
        h12={h12}
        hijriOffset={hijriOffset}
        locating={locating}
        onSearch={onSearch}
        onLocate={onLocate}
      />

      <NextPrayer
        next={nextSalah}
        formattedTime={nextFormatted}
        remaining={remaining}
        progress={progress}
        isTomorrow={isTomorrow}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {PRAYER_ORDER.map((item, idx) => {
          const { h, m } = parseHM(data.timings[item.key]);
          const time = formatHM(h, m, h12);
          let s: CardStatus = "idle";
          if (item.key === nextSalah.key) s = "next";
          else if (item.key === prevSalah.key && item.key !== "Sunrise")
            s = "current";
          else if (item.key === "Sunrise" && nextEvent.key === "Sunrise")
            s = "soon";
          return (
            <PrayerCard
              key={item.key}
              item={item}
              time={time}
              status={s}
              index={idx}
              isTomorrow={isTomorrow && item.key === nextSalah.key}
            />
          );
        })}
      </div>

      <Qibla bearing={bearing} lat={location.lat} lon={location.lon} />
    </div>
  );
}
