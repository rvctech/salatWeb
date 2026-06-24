# Salat Times 🕌

A beautiful, fully-functional prayer-times web app with live next-prayer countdown, Hijri date, and Qibla direction.

![Built with React + Vite + Tailwind](https://img.shields.io/badge/React_19-Vite_7-Tailwind_4-teal)

## ✨ Features

- **📍 Location** — use your current location (browser Geolocation) **or** search any city worldwide (live autocomplete powered by OpenStreetMap/Nominatim). Your last location is remembered.
- **⏱️ Live countdown** — timezone-aware next-prayer countdown with a progress bar (computed in the location's timezone, so it's always correct).
- **🃏 Prayer grid** — Fajr, Sunrise, Dhuhr, Asr, Maghrib & Isha with English + Arabic names, custom icons, and `NEXT` / `NOW` / `SOON` status.
- **🌙 Hijri & Gregorian dates** plus a live local clock.
- **🧭 Qibla compass** — bearing in degrees, distance to Makkah, and an optional live device-orientation compass.
- **⚙️ Settings** — 11 calculation methods, Asr school (Shafi/Hanafi), and 12/24-hour format. All persisted to `localStorage`.

## 🛠️ Tech

- React 19 + TypeScript
- Vite 7 (single-file build)
- Tailwind CSS v4
- [Aladhan API](https://aladhan.com) for prayer times & Hijri dates
- [OpenStreetMap Nominatim](https://nominatim.org) for geocoding

## 🚀 Getting started

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# build for production (outputs a single dist/index.html)
npm run build
```

## 📁 Project structure

```
src/
├── App.tsx                  # entry — state, location, search, countdown logic
├── lib/
│   ├── api.ts               # API calls, timezone/countdown/qibla math
│   └── types.ts
├── hooks/useNow.ts          # ticking clock
└── components/
    ├── Background.tsx       # animated islamic-pattern backdrop
    ├── LocationBar.tsx      # location, clock & dates
    ├── NextPrayer.tsx       # countdown hero
    ├── PrayerCard.tsx       # single prayer tile
    ├── Qibla.tsx            # compass
    ├── SearchPanel.tsx      # city search modal
    ├── SettingsPanel.tsx    # calculation settings modal
    ├── Modal.tsx
    └── Icons.tsx            # SVG icon set
```

---

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
