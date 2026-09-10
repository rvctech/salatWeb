import { LocateIcon, SearchIcon } from "./Icons";

interface Props {
  message: string;
  onRetry: () => void;
  onSearch: () => void;
  locating: boolean;
}

export default function ErrorView({
  message,
  onRetry,
  onSearch,
  locating,
}: Props) {
  return (
    <div className="animate-fadeUp mx-auto flex max-w-lg flex-col items-center pt-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-danger-soft text-danger ring-1 ring-red-400/30">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          className="h-8 w-8"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
      </span>
      <h2 className="mt-5 font-display text-2xl font-bold text-cream">
        Couldn't load times
      </h2>
      <p className="mt-2 max-w-sm text-cream/70">{message}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={onRetry}
          disabled={locating}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-gold to-gold-soft px-5 py-3 font-semibold text-night transition hover:brightness-105 active:scale-95 disabled:opacity-70"
        >
          {locating ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-night/40 border-t-night" />
          ) : (
            <LocateIcon className="h-5 w-5" />
          )}
          Try again
        </button>
        <button
          onClick={onSearch}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-5 py-3 font-semibold text-cream transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
        >
          <SearchIcon className="h-5 w-5" />
          Search a city
        </button>
      </div>
    </div>
  );
}
