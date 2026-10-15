import { useEffect, useRef } from 'react';
import type { DisconnectReason } from '../../services/protocol';

const COPY: Record<DisconnectReason, { title: string; body: string }> = {
  unreachable: {
    title: "Couldn't reach The Dam",
    body: 'The room server might be offline. Check your connection and try again in a moment.',
  },
  lost: {
    title: 'Lost connection to The Dam',
    body: 'The other beavers can no longer see you. Head back and enter again.',
  },
};

interface ConnectionNoticeProps {
  reason: DisconnectReason;
  onBack: () => void;
}

/** Shown when the room server can't be reached or the connection drops; there is no auto-reconnect. */
export function ConnectionNotice({ reason, onBack }: ConnectionNoticeProps) {
  const { title, body } = COPY[reason];
  const back = useRef<HTMLButtonElement>(null);
  // An alert dialog moves focus to its action, so keyboard players aren't left in the dead room.
  useEffect(() => back.current?.focus(), []);
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-ink/70 p-4">
      <div
        role="alertdialog"
        aria-labelledby="connection-title"
        aria-describedby="connection-body"
        className="flex w-full max-w-sm flex-col gap-3 rounded-3xl border-4 border-ink bg-cream p-5 text-center shadow-[0_6px_0_var(--color-ink)]"
      >
        <h2 id="connection-title" className="font-display text-2xl font-semibold text-ink">
          {title}
        </h2>
        <p id="connection-body" className="font-body text-base font-bold text-bark-500">
          {body}
        </p>
        <button
          type="button"
          ref={back}
          onClick={onBack}
          className="rounded-2xl border-[3px] border-ink bg-lantern-400 px-3 py-2 font-display text-lg font-semibold text-ink shadow-[0_3px_0_var(--color-ink)] transition hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          Back to my beaver
        </button>
      </div>
    </div>
  );
}
