import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./Icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, icon, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Save previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Focus trap
      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first focusable element
    requestAnimationFrame(() => {
      const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      // Restore focus
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto sm:items-center sm:p-4"
    >
      <div
        className="animate-fadeIn fixed inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="modal-panel relative z-10 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-[var(--color-glass-border)] glass-strong p-5 pt-3 shadow-2xl sm:max-h-none sm:rounded-3xl sm:pt-5">
        {/* Sheet grabber — phones only */}
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-cream/25 sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cream">
            {icon}
            <h2 className="font-display text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-cream/60 transition hover:bg-cream/10 hover:text-cream"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
