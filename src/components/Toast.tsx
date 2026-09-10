import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "./Icons";

interface Props {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export default function Toast({ message, onDismiss, durationMs = 6000 }: Props) {
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (!message) {
      // Sync visibility with message prop — external state sync
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(false);
      dismissedRef.current = false;
      return;
    }
    dismissedRef.current = false;
    setVisible(true);
    const t = setTimeout(() => {
      if (!dismissedRef.current) {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }
    }, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-glass-border)] glass-strong px-5 py-3 shadow-2xl">
        <p className="max-w-xs text-sm text-cream/80">{message}</p>
        <button
          onClick={() => {
            dismissedRef.current = true;
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="ml-2 shrink-0 rounded-full p-1 text-cream/60 transition hover:bg-cream/10 hover:text-cream"
          aria-label="Dismiss"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
