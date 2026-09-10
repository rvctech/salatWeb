# Salat Times 🕌

A beautiful prayer-times PWA with live next-prayer countdown, Hijri date, Qibla compass, monthly timetable, and prayer alerts.

![Built with React + Vite + Tailwind](https://img.shields.io/badge/React_19-Vite_7-Tailwind_4-teal)

## ✨ Features

- **📍 Location** — browser geolocation **or** worldwide city search (OpenStreetMap/Nominatim) with debounced autocomplete, recent searches, popular cities, and keyboard navigation. Last location remembered.
- **⏱️ Live countdown** — timezone-aware next-prayer countdown with progress bar, plus a live tab title (`12:04:33 until Maghrib`).
- **🗓️ Timetable** — Today/Tomorrow tabs plus a full **month view** (per-day times, Hijri range, today highlighted). List rows with English + Arabic names and `NEXT` / `NOW` / `SOON` status.
- **🌙 Hijri & Gregorian dates**, live local clock, adjustable Hijri offset (±5 days).
- **🧭 Qibla compass** — gold-arc dial, ornate needle, bearing in degrees + cardinal, distance to Makkah, live device-orientation mode with green success ring, haptic buzz-on-align toggle, and `Qibla ° / You °` readout.
- **🔔 Prayer alerts** — fires at prayer time with a soft synth **ping** (offline-safe) or streamed **Adhan** with ping fallback; on/off toggle.
- **🎨 5 themes** — Teal Night, Light, Midnight Blue, Desert Sand, Royal Purple. All gold-accented, persisted with all settings to `localStorage`.
- **⚙️ Settings** — 11 calculation methods, Asr school (Shafi/Hanafi), 12/24-hour format, alert sound, Hijri adjustment.
- **📴 Offline-first** — service-worker precache + 24h Aladhan API cache, stale-cache banner with age, installable PWA with generated icons.

## 🛠️ Tech

- React 19 + TypeScript
- Vite 7 + vite-plugin-pwa (Workbox)
- Tailwind CSS v4
- Material UI icons (`@mui/icons-material`) + two custom glyphs (Kaaba, Qibla)
- [Aladhan API](https://aladhan.com) for prayer times & Hijri dates
- [OpenStreetMap Nominatim](https://nominatim.org) for geocoding

## 🚀 Getting started

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# typecheck + lint + tests
npm run typecheck && npm run lint && npm test -- --run

# build for production (PWA output in dist/)
npm run build

# regenerate PWA icons (runs automatically before build)
npm run generate-icons
```

## 📁 Project structure

```
src/
├── App.tsx                  # entry — state, location, sticky header, panels
├── lib/
│   ├── api.ts               # Aladhan/Nominatim calls, settings, themes
│   ├── time.ts              # timezone/countdown/status math
│   ├── hijri.ts             # Hijri adjustment
│   ├── qibla.ts             # bearing + distance math
│   ├── notify.ts            # synth ping + Adhan stream
│   ├── storage.ts           # localStorage (location, settings, cache, recents)
│   └── types.ts
├── hooks/useNow.ts          # ticking clock
└── components/
    ├── Background.tsx       # animated islamic-pattern backdrop
    ├── LocationBar.tsx      # location, clock & dates (display-only)
    ├── NextPrayer.tsx       # countdown hero
    ├── PrayerCard.tsx       # prayer timetable row
    ├── MonthPanel.tsx       # monthly timetable modal
    ├── Qibla.tsx            # compass dial + live orientation
    ├── SearchPanel.tsx      # city search modal
    ├── SettingsPanel.tsx    # calculation/appearance/alerts modal
    ├── Welcome.tsx          # first-run screen
    ├── ErrorView.tsx        # error screen
    ├── Toast.tsx
    ├── Modal.tsx
    └── Icons.tsx            # Material UI icon layer + custom glyphs
```

---

بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
