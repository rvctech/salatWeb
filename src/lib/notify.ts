/* Sound engine — synth ping (Web Audio, offline-safe) + Adhan MP3.
 *
 * Adhan recording: "The Adhan - Muslim Call to Prayer" by Atcovi
 * (Aaqib Azeez), CC BY-SA 4.0 via Wikimedia Commons. Self-hosted in
 * `public/adhan.mp3` (and PWA-precached) so alerts work offline.
 * The previous hotlinked URL served a bot-check page (HTTP 202 text/html)
 * and could never play — hence silent Adhan alerts.
 */

const ADHAN_URL = `${import.meta.env.BASE_URL}adhan.mp3`;

let ctx: AudioContext | null = null;

/** Resolve a *running* AudioContext, creating + resuming as needed. */
async function getContext(): Promise<AudioContext | null> {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    // Await the resume: scheduling notes against a suspended context's
    // frozen currentTime is the classic "works on desktop, silent on
    // mobile" bug — notes get stamped at t=0 and are easily missed.
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* fall through to state check */
      }
    }
    return ctx.state === "running" ? ctx : null;
  } catch {
    return null;
  }
}

/**
 * Synchronous unlock for user gestures: create/resume so the browser
 * counts the page as interacted. Playback itself goes through getContext().
 */
export function ensureAudio(): boolean {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return false;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return true;
  } catch {
    return false;
  }
}

let adhanAudio: HTMLAudioElement | null = null;

export async function playAdhan(): Promise<boolean> {
  try {
    stopAdhan();
    const audio = new Audio(ADHAN_URL);
    audio.preload = "auto";
    adhanAudio = audio;
    let settled = false;
    const fallback = () => {
      if (settled) return;
      settled = true;
      void playPing();
    };
    audio.addEventListener("error", fallback, { once: true });
    try {
      await audio.play();
      settled = true;
      return true;
    } catch {
      fallback();
      return false;
    }
  } catch {
    return playPing();
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

export async function playPing(volume = 0.18): Promise<boolean> {
  const ac = await getContext();
  if (!ac) return false;
  try {
    // Small headroom past currentTime so the envelope survives any
    // resume timing wobble on mobile browsers.
    const t0 = ac.currentTime + 0.05;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const start = t0 + i * 0.28;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
    return true;
  } catch {
    return false;
  }
}

/* Vibration — only exists on Android Chrome over HTTPS (secure context).
 * iPhones and desktops expose no vibration hardware to the web. */

export function vibrateSupported(): boolean {
  try {
    return "vibrate" in navigator;
  } catch {
    return false;
  }
}

export function vibrateNow(pattern: number | number[] = 60): boolean {
  try {
    if (!("vibrate" in navigator)) return false;
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}
