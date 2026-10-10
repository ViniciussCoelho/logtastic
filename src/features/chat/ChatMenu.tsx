import { useCallback, useRef, useState } from 'react';
import { HudButton } from '../../components/HudButton';
import { useDismiss } from '../../components/useDismiss';
import { CHAT_CATEGORIES, type ChatCategoryId, type ChatMessageId } from './messages';

interface ChatMenuProps {
  onSend: (messageId: ChatMessageId) => void;
}

/** Predefined phrases only: the player picks a category, then a message. */
export function ChatMenu({ onSend }: ChatMenuProps) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<ChatCategoryId>('greetings');
  const root = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(root, open, close);

  const category = CHAT_CATEGORIES.find((c) => c.id === categoryId) ?? CHAT_CATEGORIES[0];

  const send = (messageId: ChatMessageId) => {
    onSend(messageId);
    setOpen(false);
  };

  return (
    <div ref={root} className="relative flex flex-col items-center">
      {open && (
        <div
          role="dialog"
          aria-label="Quick messages"
          className="absolute bottom-full left-1/2 mb-4 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border-4 border-ink bg-cream p-3 shadow-[0_6px_0_var(--color-ink)]"
        >
          <div role="tablist" aria-label="Message categories" className="mb-3 grid grid-cols-3 gap-1.5">
            {CHAT_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={c.id === categoryId}
                onClick={() => setCategoryId(c.id)}
                className="rounded-full border-[3px] border-ink px-2 py-1 font-display text-base font-semibold text-ink transition aria-selected:bg-sky-300 aria-[selected=false]:bg-white aria-[selected=false]:hover:bg-sky-100"
              >
                {c.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" aria-label={category.label} className="grid grid-cols-2 gap-2">
            {category.messages.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => send(message.id)}
                className="rounded-2xl border-[3px] border-ink bg-white px-3 py-2.5 text-left font-body text-lg font-extrabold text-ink shadow-[0_3px_0_var(--color-ink)] transition hover:-translate-y-0.5 hover:bg-lantern-400 active:translate-y-0.5 active:shadow-none"
              >
                {message.text}
              </button>
            ))}
          </div>
          <span
            aria-hidden="true"
            className="absolute -bottom-3 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 border-r-4 border-b-4 border-ink bg-cream"
          />
        </div>
      )}
      <HudButton aria-label="Quick messages" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="h-14 w-14">
        <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
          <path
            d="M8 10 h32 a6 6 0 0 1 6 6 v14 a6 6 0 0 1 -6 6 h-18 l-9 8 v-8 h-5 a6 6 0 0 1 -6 -6 v-14 a6 6 0 0 1 6 -6 z"
            fill="#fff"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="23" r="2.8" fill="currentColor" />
          <circle cx="24" cy="23" r="2.8" fill="currentColor" />
          <circle cx="32" cy="23" r="2.8" fill="currentColor" />
        </svg>
      </HudButton>
    </div>
  );
}
