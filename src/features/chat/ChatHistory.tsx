import { useEffect, useRef } from 'react';
import type { ChatLogEntry } from './chatLog';
import { EmoteImage } from './EmoteImage';

interface ChatHistoryProps {
  entries: readonly ChatLogEntry[];
  selfId: string | null;
}

/** Scrollable log of everything said in the room; sticks to the newest line. */
export function ChatHistory({ entries, selfId }: ChatHistoryProps) {
  const list = useRef<HTMLOListElement>(null);

  // Scroll only the list itself, never the page around it.
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [entries]);

  return (
    <section
      aria-label="Chat history"
      className="flex max-h-72 w-[min(24rem,calc(100vw-2rem))] flex-col rounded-3xl border-4 border-ink bg-cream shadow-[0_6px_0_var(--color-ink)]"
    >
      <h2 className="border-b-[3px] border-ink px-4 py-2 font-display text-lg font-semibold text-ink">Chat history</h2>
      {entries.length === 0 ? (
        <p className="px-4 py-6 text-center font-bold text-bark-500">It's quiet here. Say hello!</p>
      ) : (
        <ol ref={list} className="flex min-h-0 flex-col gap-1.5 overflow-y-auto px-4 py-3">
          {entries.map((entry) => (
            <li key={entry.key} className="flex items-center gap-2 font-body text-base leading-snug text-ink">
              <span className={`shrink-0 font-extrabold ${entry.playerId === selfId ? 'text-lantern-500' : 'text-bark-700'}`}>
                {entry.nickname}:
              </span>
              {entry.kind === 'text' ? (
                <span className="min-w-0 break-words font-semibold">{entry.text}</span>
              ) : (
                <EmoteImage id={entry.emoteId} fur={entry.fur} className="h-11 w-11" />
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
