export interface PrayerTime {
  key: string;
  name: string;
  arabic: string;
  time: string;
}

export interface PlaceSuggestion {
  lat: number;
  lon: number;
  label: string;
  sublabel?: string;
  raw: string;
}

export interface LocationInfo {
  lat: number;
  lon: number;
  label: string;
  sublabel?: string;
  source: "geo" | "search";
}

export interface PrayerData {
  timings: Record<string, string>;
  readable: string;
  hijri: string;
  hijriDay: string;
  hijriMonthEn: string;
  hijriMonthAr: string;
  hijriYear: string;
  hijriWeekday: string;
  gregorian: string;
  weekday: string;
  timezone: string;
  method: number;
  latitude: number;
  longitude: number;
}

export interface CalcMethod {
  id: number;
  name: string;
  region: string;
}

export type PanelType = "search" | "settings" | null;
