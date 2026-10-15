import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { HudButton } from '../../components/HudButton';
import { useDismiss } from '../../components/useDismiss';
import type { FurColorId } from '../character/appearance';
import { ChatHistory } from './ChatHistory';
import { ChatMenu } from './ChatMenu';
import type { ChatLogEntry } from './chatLog';
import { EmoteMenu } from './EmoteMenu';
import { emoteForHotkey, type EmoteId } from './emotes';
import { CHAT_TEXT_MAX_LENGTH, validateChatText } from './freeText';
import type { ChatMessageId } from './messages';

/** The counter appears once a message gets this close to the limit. */
const COUNTER_FROM = CHAT_TEXT_MAX_LENGTH - 20;
const SLOW_DOWN_MS = 1800;
const NUDGE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-9px) rotate(-1deg)' },
  { transform: 'translateX(7px) rotate(1deg)' },
  { transform: 'translateX(-4px)' },
  { transform: 'translateX(0)' },
];

interface ChatBarProps {
  fur: FurColorId;
  entries: readonly ChatLogEntry[];
  selfId: string | null;
  /** Each send returns false when it was not sent (e.g. the player is sending too fast). */
  onSendPreset: (messageId: ChatMessageId) => boolean;
  onSendText: (text: string) => boolean;
  onSendEmote: (emoteId: EmoteId) => boolean;
  /** False when the room can't relay emotes: the menu and number keys go away. */
  emotesEnabled?: boolean;
}

/** Where a key press belongs to a field, not to the room. */
function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/**
 * The bottom chat bar: history, quick messages, free typing and emotes.
 * Keyboard: Enter jumps into the message field, 1–9 send emotes, ↑ brings back the last
 * typed message and Escape leaves the field.
 */
export function ChatBar({ fur, entries, selfId, onSendPreset, onSendText, onSendEmote, emotesEnabled = true }: ChatBarProps) {
  const [draft, setDraft] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [seen, setSeen] = useState(0);
  const [slowDown, setSlowDown] = useState(0);
  const lastSent = useRef('');
  const input = useRef<HTMLInputElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const historyRoot = useRef<HTMLDivElement>(null);
  const closeHistory = useCallback(() => {
    setHistoryOpen(false);
    setSeen(entries.length);
  }, [entries.length]);
  useDismiss(historyRoot, historyOpen, closeHistory);

  const unread = historyOpen ? 0 : Math.max(0, entries.length - seen);

  // Each refusal shakes the bar and restarts the hint's timer.
  const refused = useCallback(() => {
    setSlowDown((n) => n + 1);
    bar.current?.animate?.(NUDGE, { duration: 380, easing: 'ease-in-out' });
  }, []);
  useEffect(() => {
    if (slowDown === 0) return;
    const timer = window.setTimeout(() => setSlowDown(0), SLOW_DOWN_MS);
    return () => window.clearTimeout(timer);
  }, [slowDown]);

  const sendEmote = useCallback((emoteId: EmoteId) => onSendEmote(emoteId) || refused(), [onSendEmote, refused]);
  const sendPreset = (messageId: ChatMessageId) => onSendPreset(messageId) || refused();

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTextField(event.target)) return;
      const emoteId = emotesEnabled ? emoteForHotkey(event.key) : null;
      if (emoteId) {
        event.preventDefault();
        sendEmote(emoteId);
      } else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement)) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sendEmote, emotesEnabled]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateChatText(draft);
    if (!result.valid) return;
    if (onSendText(result.text)) {
      lastSent.current = result.text;
      setDraft('');
    } else {
      refused();
    }
  };

  const onFieldKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' && draft === '' && lastSent.current) {
      event.preventDefault();
      setDraft(lastSent.current);
    } else if (event.key === 'Escape') {
      event.currentTarget.blur();
    }
  };

  // Same unit as the field's own maxLength, so the counter hits the limit exactly when typing stops.
  const length = draft.length;

  return (
    <div className="relative flex flex-col items-center">
      <p
        role="status"
        className={`pointer-events-none absolute bottom-full mb-3 rounded-full border-[3px] border-ink bg-lantern-400 px-4 py-1.5 font-display text-base font-semibold whitespace-nowrap text-ink shadow-[0_3px_0_var(--color-ink)] transition ${slowDown ? 'opacity-100' : 'translate-y-2 opacity-0'}`}
      >
        {slowDown ? 'Easy there, busy beaver! One moment…' : ''}
      </p>
      <div
        ref={bar}
        className="flex max-w-full items-end gap-1.5 rounded-full border-4 border-ink bg-sky-200 p-1.5 shadow-[0_6px_0_var(--color-ink)] roomy:gap-3 roomy:p-2"
      >
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
            className="relative size-11 roomy:size-14"
          >
            <svg viewBox="0 0 48 48" className="size-6 roomy:size-8" aria-hidden="true">
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
        <ChatMenu onSend={sendPreset} />
        <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-1.5 roomy:gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Type a message
          </label>
          <div className="relative min-w-0 flex-1">
            <input
              ref={input}
              id="chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onFieldKey}
              maxLength={CHAT_TEXT_MAX_LENGTH}
              autoComplete="off"
              enterKeyHint="send"
              placeholder="Say something…"
              aria-describedby={length >= COUNTER_FROM ? 'chat-counter' : undefined}
              className="h-11 w-full rounded-full border-[3px] border-ink bg-white px-4 font-body text-base font-bold text-ink outline-none placeholder:text-bark-300 focus:border-lantern-500 roomy:h-14 roomy:w-[min(22rem,40vw)] roomy:px-5 roomy:text-lg"
            />
            {length >= COUNTER_FROM && (
              <span
                id="chat-counter"
                className={`pointer-events-none absolute -top-2.5 right-4 rounded-full border-2 border-ink px-1.5 text-xs font-extrabold tabular-nums ${length >= CHAT_TEXT_MAX_LENGTH ? 'bg-berry-500 text-white' : 'bg-cream text-ink'}`}
              >
                {length}/{CHAT_TEXT_MAX_LENGTH}
                <span className="sr-only"> characters</span>
              </span>
            )}
          </div>
          <HudButton type="submit" aria-label="Send" className="size-11 shrink-0 bg-lantern-400 hover:bg-lantern-400 roomy:size-14">
            <svg viewBox="0 0 48 48" className="size-6 roomy:size-7" aria-hidden="true">
              <path d="M8 24 L40 10 L32 40 L24 28 Z" fill="#fff" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
            </svg>
          </HudButton>
        </form>
        {emotesEnabled && <EmoteMenu fur={fur} onSend={sendEmote} />}
      </div>
    </div>
  );
}
