# Salat Times 🕌

A beautiful, fully-functional prayer-times web app with live next-prayer countdown, Hijri date, Qibla direction, monthly timetable, prayer alerts, 5 themes, and offline PWA support.

Built with React + Vite + Tailwind.

![React 19](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite 7](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/tailwindcss-%2338BDF8.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

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
- Zero-dependency inline SVG icons (Material glyph paths, inlined) + two custom glyphs (Kaaba, Qibla)
- [Aladhan API](https://aladhan.com) for prayer times & Hijri dates
- [OpenStreetMap Nominatim](https://nominatim.org) for geocoding
- Adhan alert recording: "The Adhan - Muslim Call to Prayer" by Atcovi (Aaqib Azeez), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), via Wikimedia Commons — self-hosted in `public/adhan.mp3`

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
