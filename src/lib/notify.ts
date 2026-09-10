/* Soft notification ping — Web Audio, no asset files.
 * Two short sine pings (880Hz → 1174Hz), ~0.9s total, gentle envelope.
 * The AudioContext must be created/resumed on a user gesture (done in
 * enableAlerts) to satisfy browser autoplay policies.
 */

let ctx: AudioContext | null = null;

export function ensureAudio(): boolean {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return false;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return true;
  } catch {
    return false;
  }
}

/* Adhan stream. Hotlinked MP3 (islamcan, long-lived); falls back to the
 * synth ping on any error so alerts never go silent.
 */
const ADHAN_URL = "https://www.islamcan.com/audio/adhan/azan1.mp3";
let adhanAudio: HTMLAudioElement | null = null;

export function playAdhan(): boolean {
  try {
    stopAdhan();
    const audio = new Audio(ADHAN_URL);
    audio.preload = "auto";
    adhanAudio = audio;
    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        playPing();
      });
    }
    audio.addEventListener(
      "error",
      () => {
        playPing();
      },
      { once: true },
    );
    return true;
  } catch {
    playPing();
    return false;
  }
}

export function stopAdhan() {
  try {
    adhanAudio?.pause();
  } catch {
    /* ignore */
  }
  adhanAudio = null;
}

export function playPing(volume = 0.18) {
  if (!ensureAudio() || !ctx) return;
  try {
    const t0 = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t0 + i * 0.28;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch {
    /* ignore */
  }
}
