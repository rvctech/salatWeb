import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-192.svg", "icon-192.png"],
      manifest: {
        name: "Salat Times — Prayer Times, Hijri Date & Qibla",
        short_name: "Salat Times",
        description:
          "Accurate daily prayer (salat) times with Hijri date, next-prayer countdown and Qibla direction.",
        theme_color: "#04161c",
        background_color: "#04161c",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "en",
        dir: "ltr",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // mp3 included so the bundled Adhan alert works fully offline.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,mp3}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.aladhan\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "aladhan-api",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2020",
    cssMinify: true,
    chunkSizeWarningLimit: 300,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        // Keep the initial shell tiny: React core goes in its own
        // long-lived chunk so first paint parses less at once and the
        // vendor hash stays stable across app edits (better HTTP cache).
        manualChunks(id) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "vendor";
          }
        },
      },
    },
  },
});
