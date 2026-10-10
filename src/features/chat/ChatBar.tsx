import { useCallback, useRef, useState, type FormEvent } from 'react';
import { HudButton } from '../../components/HudButton';
import { useDismiss } from '../../components/useDismiss';
import type { FurColorId } from '../character/appearance';
import { ChatHistory } from './ChatHistory';
import { ChatMenu } from './ChatMenu';
import type { ChatLogEntry } from './chatLog';
import { EmoteMenu } from './EmoteMenu';
import type { EmoteId } from './emotes';
import { CHAT_TEXT_MAX_LENGTH, validateChatText } from './freeText';
import type { ChatMessageId } from './messages';

interface ChatBarProps {
  fur: FurColorId;
  entries: readonly ChatLogEntry[];
  selfId: string | null;
  onSendPreset: (messageId: ChatMessageId) => void;
  /** Returns false when the message was not sent (e.g. the player is sending too fast). */
  onSendText: (text: string) => boolean;
  onSendEmote: (emoteId: EmoteId) => void;
}

/** The bottom chat bar: history, quick messages, free typing and emotes. */
export function ChatBar({ fur, entries, selfId, onSendPreset, onSendText, onSendEmote }: ChatBarProps) {
  const [draft, setDraft] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const historyRoot = useRef<HTMLDivElement>(null);
  const closeHistory = useCallback(() => {
    setHistoryOpen(false);
    setSeen(entries.length);
  }, [entries.length]);
  useDismiss(historyRoot, historyOpen, closeHistory);

  const unread = historyOpen ? 0 : Math.max(0, entries.length - seen);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateChatText(draft);
    if (result.valid && onSendText(result.text)) setDraft('');
  };

  return (
    <div className="flex items-end gap-2 rounded-full border-4 border-ink bg-sky-200 p-2 shadow-[0_6px_0_var(--color-ink)] sm:gap-3">
      <div ref={historyRoot} className="relative">
        {historyOpen && (
          <div className="absolute bottom-full left-0 mb-4">
            <ChatHistory entries={entries} selfId={selfId} />
          </div>
        )}
        <HudButton
          aria-label="Chat history"
          aria-expanded={historyOpen}
          onClick={() => (historyOpen ? closeHistory() : setHistoryOpen(true))}
          className="relative h-14 w-14"
        >
          <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden="true">
            <path d="M12 8 h24 a4 4 0 0 1 4 4 v26 a4 4 0 0 1 -4 4 h-24 a4 4 0 0 1 -4 -4 v-26 a4 4 0 0 1 4 -4 z" fill="#fff" stroke="currentColor" strokeWidth="3.5" />
            <path d="M15 17 h18 M15 24 h18 M15 31 h11" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-ink bg-berry-500 px-1 text-xs font-extrabold text-white tabular-nums">
              {unread > 9 ? '9+' : unread}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </HudButton>
      </div>
      <ChatMenu onSend={onSendPreset} />
      <form onSubmit={submit} className="flex items-center gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Type a message
        </label>
        <input
          id="chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={CHAT_TEXT_MAX_LENGTH}
          autoComplete="off"
          placeholder="Say something…"
          className="h-14 w-[min(22rem,40vw)] rounded-full border-[3px] border-ink bg-white px-5 font-body text-lg font-bold text-ink outline-none placeholder:text-bark-300 focus:border-lantern-500"
        />
        <HudButton type="submit" aria-label="Send" className="h-14 w-14 bg-lantern-400 hover:bg-lantern-400">
          <svg viewBox="0 0 48 48" className="h-7 w-7" aria-hidden="true">
            <path d="M8 24 L40 10 L32 40 L24 28 Z" fill="#fff" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          </svg>
        </HudButton>
      </form>
      <EmoteMenu fur={fur} onSend={onSendEmote} />
    </div>
  );
}
