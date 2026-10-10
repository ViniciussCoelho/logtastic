import { useCallback, useRef, useState } from 'react';
import { HudButton } from '../../components/HudButton';
import { useDismiss } from '../../components/useDismiss';

interface SettingsMenuProps {
  namesVisible: boolean;
  onNamesVisibleChange: (visible: boolean) => void;
  filmLook: boolean;
  onFilmLookChange: (enabled: boolean) => void;
  onLeave: () => void;
}

export function SettingsMenu({ namesVisible, onNamesVisibleChange, filmLook, onFilmLookChange, onLeave }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(root, open, close);

  return (
    <div ref={root} className="relative">
      <HudButton aria-label="Settings" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="h-13 w-13">
        <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
          <path
            d="M24 6 l4 5 6 -2 1 6 6 2 -2 6 5 4 -5 4 2 6 -6 2 -1 6 -6 -2 -4 5 -4 -5 -6 2 -1 -6 -6 -2 2 -6 -5 -4 5 -4 -2 -6 6 -2 1 -6 6 2 z"
            fill="#fff"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="3.5" />
        </svg>
      </HudButton>
      {open && (
        <div
          role="dialog"
          aria-label="Settings"
          className="absolute top-full right-0 mt-3 flex w-64 flex-col gap-3 rounded-3xl border-4 border-ink bg-cream p-4 shadow-[0_6px_0_var(--color-ink)]"
        >
          <Toggle id="setting-names" label="Show nicknames" checked={namesVisible} onChange={onNamesVisibleChange} />
          <Toggle id="setting-film" label="Old film look" checked={filmLook} onChange={onFilmLookChange} />
          <button
            type="button"
            onClick={onLeave}
            className="mt-1 rounded-2xl border-[3px] border-ink bg-berry-500 px-3 py-2 font-display text-lg font-semibold text-white shadow-[0_3px_0_var(--color-ink)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Leave The Dam
          </button>
        </div>
      )}
    </div>
  );
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 font-body text-base font-extrabold text-ink">
      {label}
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full border-[3px] border-ink bg-white transition peer-checked:bg-moss-500 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lantern-400 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:border-2 after:border-ink after:bg-white after:transition peer-checked:after:translate-x-5"
      />
    </label>
  );
}
