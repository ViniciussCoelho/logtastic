import type { ReactNode } from 'react';

interface OptionTileProps {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
}

/** A visually styled native radio, so pickers keep keyboard and screen reader behavior for free. */
export function OptionTile({ name, value, label, checked, onSelect, children }: OptionTileProps) {
  return (
    <label className="group flex cursor-pointer flex-col items-center gap-1.5 text-center">
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span
        className={`grid aspect-square w-full place-items-center rounded-2xl border-[3px] border-bark-900 transition peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lantern-400 ${
          checked
            ? '-translate-y-1 bg-lantern-400 shadow-[0_5px_0_var(--color-bark-900)]'
            : 'bg-birch-100 shadow-[0_3px_0_var(--color-bark-900)] group-hover:-translate-y-0.5 group-hover:bg-birch-50'
        }`}
      >
        {children}
      </span>
      <span className={`text-xs leading-tight font-extrabold ${checked ? 'text-lantern-400' : 'text-birch-100'}`}>
        {label}
      </span>
    </label>
  );
}
