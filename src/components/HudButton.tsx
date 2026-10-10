import type { ButtonHTMLAttributes } from 'react';

/** Chunky round toy-like button used across the in-room HUD. */
export function HudButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`grid place-items-center rounded-full border-[3px] border-ink bg-sky-300 text-ink shadow-[0_4px_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:bg-sky-200 active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-ink)] aria-expanded:bg-lantern-400 ${className}`}
    />
  );
}
