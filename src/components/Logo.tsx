interface LogoProps {
  className?: string;
}

/** Wordmark: a cut log end standing in for the "o". */
export function Logo({ className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-1 font-display font-bold tracking-tight ${className}`}>
      <span className="text-birch-50 [text-shadow:0_3px_0_var(--color-bark-900)]">L</span>
      <svg viewBox="0 0 40 40" className="h-[0.85em] w-[0.85em] translate-y-[0.06em]" aria-hidden="true">
        <circle cx="20" cy="20" r="17" fill="#e9c38f" stroke="#3b2416" strokeWidth="3.5" />
        <circle cx="20" cy="20" r="11" fill="none" stroke="#b07a48" strokeWidth="2" />
        <circle cx="20" cy="20" r="5" fill="none" stroke="#b07a48" strokeWidth="2" />
      </svg>
      <span className="text-birch-50 [text-shadow:0_3px_0_var(--color-bark-900)]">gtastic</span>
      <span className="sr-only">Logtastic</span>
    </span>
  );
}
