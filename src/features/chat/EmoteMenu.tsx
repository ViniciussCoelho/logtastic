import { useCallback, useRef, useState } from 'react';
import { HudButton } from '../../components/HudButton';
import { useDismiss } from '../../components/useDismiss';
import type { FurColorId } from '../character/appearance';
import { EmoteImage } from './EmoteImage';
import { EMOTES, type EmoteId } from './emotes';

interface EmoteMenuProps {
  fur: FurColorId;
  onSend: (emoteId: EmoteId) => void;
}

/** Grid of beaver emotes in the player's own fur. */
export function EmoteMenu({ fur, onSend }: EmoteMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(root, open, close);

  return (
    <div ref={root} className="relative">
      {open && (
        <div
          role="dialog"
          aria-label="Emotes"
          className="absolute right-0 bottom-full mb-4 grid w-[min(20rem,calc(100vw-2rem))] grid-cols-4 gap-2 rounded-3xl border-4 border-ink bg-cream p-3 shadow-[0_6px_0_var(--color-ink)]"
        >
          {EMOTES.map((emote, index) => (
            <button
              key={emote.id}
              type="button"
              aria-label={emote.label}
              aria-keyshortcuts={index < 9 ? String(index + 1) : undefined}
              title={`${emote.label} ${emote.emoji}${index < 9 ? ` (${index + 1})` : ''}`}
              onClick={() => {
                onSend(emote.id);
                setOpen(false);
              }}
              className="relative grid aspect-square place-items-center rounded-2xl border-[3px] border-ink bg-white shadow-[0_3px_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:bg-lantern-400 active:translate-y-0.5 active:shadow-none"
            >
              <EmoteImage id={emote.id} fur={fur} decorative className="w-[82%]" />
              {index < 9 && (
                <kbd aria-hidden="true" className="pointer-coarse:hidden absolute top-0.5 left-1.5 font-display text-xs font-semibold text-bark-500">
                  {index + 1}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
      <HudButton aria-label="Emotes" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="size-11 shrink-0 roomy:size-14">
        <EmoteImage id="laugh" fur={fur} decorative className="w-8 roomy:w-10" />
      </HudButton>
    </div>
  );
}
