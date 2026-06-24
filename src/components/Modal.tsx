import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, icon, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="animate-fadeIn fixed inset-0 bg-night/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-popIn relative z-10 my-6 w-full max-w-md rounded-3xl border border-white/12 glass-strong p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cream">
            {icon}
            <h2 className="font-display text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-cream/60 transition hover:bg-white/10 hover:text-cream"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
