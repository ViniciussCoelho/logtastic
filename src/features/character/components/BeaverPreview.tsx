import { useEffect, useState } from 'react';
import { describeAppearance, type AvatarAppearance } from '../appearance';
import { DIRECTIONS } from '../avatar/pose';
import { BeaverAvatar } from './BeaverAvatar';

const BLINK_MS = 140;

/** Blinks at irregular intervals so the preview feels alive. */
function useBlink(): boolean {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      timer = setTimeout(() => {
        setBlink(true);
        timer = setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, BLINK_MS);
      }, 2200 + Math.random() * 2800);
    };
    scheduleBlink();
    return () => clearTimeout(timer);
  }, []);

  return blink;
}

interface BeaverPreviewProps {
  appearance: AvatarAppearance;
  nickname: string;
}

export function BeaverPreview({ appearance, nickname }: BeaverPreviewProps) {
  const [facing, setFacing] = useState(0);
  const blink = useBlink();
  const direction = DIRECTIONS[facing] ?? 'front';
  const turn = (delta: number) => setFacing((current) => (current + delta + DIRECTIONS.length) % DIRECTIONS.length);

  return (
    <section aria-label="Beaver preview" className="flex flex-col items-center">
      <div className="relative flex w-full max-w-sm flex-col items-center">
        <p
          className="mb-2 max-w-full truncate rounded-full border-[3px] border-ink bg-white px-4 py-0.5 font-display text-lg font-semibold text-ink shadow-[0_3px_0_var(--color-ink)]"
          aria-hidden="true"
        >
          {nickname || 'Your beaver'}
        </p>

        {/* Keyed on the outfit so every change replays the hop. */}
        <div key={`${appearance.fur}-${appearance.hat}`} className="relative z-10 w-60 animate-hop sm:w-80">
          <div className="origin-bottom animate-breathe">
            <BeaverAvatar
              appearance={appearance}
              pose={{ direction, step: 0, blink }}
              label={`Your beaver: ${describeAppearance(appearance)}, facing ${direction}`}
              className="w-full drop-shadow-[0_6px_0_rgb(20_38_31/0.25)]"
            />
          </div>
        </div>

        <TreeStump />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <TurnButton label="Turn beaver left" onClick={() => turn(-1)}>
          ‹
        </TurnButton>
        <span className="w-20 rounded-full border-[3px] border-ink bg-white py-0.5 text-center text-sm font-extrabold tracking-wider text-ink uppercase">
          {direction}
        </span>
        <TurnButton label="Turn beaver right" onClick={() => turn(1)}>
          ›
        </TurnButton>
      </div>
    </section>
  );
}

function TurnButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-white pb-1 font-display text-3xl leading-none text-bark-900 shadow-[0_3px_0_var(--color-bark-900)] transition hover:-translate-y-0.5 hover:bg-birch-50 active:translate-y-0.5 active:shadow-none"
    >
      {children}
    </button>
  );
}

/** The stage the beaver stands on: a freshly cut stump with growth rings. */
function TreeStump() {
  return (
    <svg viewBox="0 0 300 110" className="-mt-16 w-76 sm:-mt-18 sm:w-96" aria-hidden="true">
      <path d="M30 40 V78 Q30 104 150 104 Q270 104 270 78 V40 Z" fill="#7c4f2e" stroke="#3b2416" strokeWidth="5" />
      <path d="M62 60 V96 M110 66 V102 M190 66 V102 M238 60 V96" stroke="#5e3a22" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="150" cy="40" rx="120" ry="30" fill="#e9c38f" stroke="#3b2416" strokeWidth="5" />
      <g fill="none" stroke="#c4935f" strokeWidth="3">
        <ellipse cx="150" cy="40" rx="94" ry="22" />
        <ellipse cx="150" cy="40" rx="66" ry="15" />
        <ellipse cx="150" cy="40" rx="38" ry="8.5" />
      </g>
      <path d="M262 52 q18 6 22 22" fill="none" stroke="#6f9a4a" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="284" cy="76" rx="9" ry="5" fill="#6f9a4a" stroke="#3b2416" strokeWidth="3" transform="rotate(50 284 76)" />
    </svg>
  );
}
