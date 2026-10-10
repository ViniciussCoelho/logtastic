import type { ServerEvent } from '../../services/protocol';
import type { FurColorId } from '../character/appearance';
import type { Roster } from '../room/roster';
import type { EmoteId } from './emotes';
import { getChatMessageText } from './messages';

export const CHAT_LOG_LIMIT = 100;

export type ChatLogEntry =
  | { key: number; playerId: string; nickname: string; kind: 'text'; text: string }
  | { key: number; playerId: string; nickname: string; kind: 'emote'; emoteId: EmoteId; fur: FurColorId };

export interface ChatLog {
  entries: readonly ChatLogEntry[];
  nextKey: number;
}

export const EMPTY_CHAT_LOG: ChatLog = { entries: [], nextKey: 0 };

/**
 * Appends whatever was said in the room, oldest first, keeping the last CHAT_LOG_LIMIT lines.
 * Names (and, for emotes, fur) come from the roster at the time the line arrives.
 */
export function applyChatLogEvent(log: ChatLog, event: ServerEvent, roster: Roster): ChatLog {
  if (event.type !== 'chat' && event.type !== 'say' && event.type !== 'emote') return log;
  const sender = roster.get(event.playerId);
  const base = { key: log.nextKey, playerId: event.playerId, nickname: sender?.nickname ?? 'A beaver' };
  let entry: ChatLogEntry;
  switch (event.type) {
    case 'chat':
      entry = { ...base, kind: 'text', text: getChatMessageText(event.messageId) };
      break;
    case 'say':
      entry = { ...base, kind: 'text', text: event.text };
      break;
    case 'emote':
      entry = { ...base, kind: 'emote', emoteId: event.emoteId, fur: sender?.appearance.fur ?? 'classic-brown' };
      break;
  }
  return { entries: [...log.entries, entry].slice(-CHAT_LOG_LIMIT), nextKey: log.nextKey + 1 };
}
