/**
 * The Go room server's wire format (see logtastic-server/internal/protocol). Every message
 * is a `{ type, payload }` envelope. This module is the only place that knows it: it
 * validates what arrives and translates between it and the app's own room events, so
 * nothing above the connection ever sees JSON or server field names.
 */
import {
  DEFAULT_APPEARANCE,
  FACE_IDS,
  FUR_COLOR_IDS,
  HAT_IDS,
} from '../features/character/appearance';
import { normalizeChatText } from '../features/chat/freeText';
import { getChatMessageText } from '../features/chat/messages';
import type { Vec2 } from '../types/geometry';
import type { ClientEvent, RoomPlayer } from './protocol';

/** The server rejects longer chat; it counts Unicode code points (Go runes). */
export const SERVER_CHAT_MAX_LENGTH = 200;
/** The server only checks that a nickname isn't blank, so name tags are capped on arrival. */
const NICKNAME_DISPLAY_MAX = 24;

export type WireEvent =
  | { type: 'player_joined'; player: RoomPlayer }
  | { type: 'room_state'; players: RoomPlayer[] }
  | { type: 'player_entered'; player: RoomPlayer }
  | { type: 'player_left'; id: string }
  | { type: 'player_moved'; id: string; position: Vec2 }
  | { type: 'chat_received'; playerId: string; text: string };

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isCoordinate = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const CONTROL_CHARACTERS = /\p{Cc}|\p{Cf}/gu;

/** Unknown appearance IDs (another client's catalogue, a typo) fall back per field instead of hiding the player. */
function pick<T extends string>(known: readonly T[], value: unknown, fallback: T): T {
  return known.includes(value as T) ? (value as T) : fallback;
}

/** A server Player (flat `furColor`, `eyeId`, `hatId`, `x`, `y`) as the app's RoomPlayer. */
function readPlayer(value: unknown): RoomPlayer | null {
  if (!isObject(value) || !isId(value.id) || typeof value.nickname !== 'string') return null;
  if (!isCoordinate(value.x) || !isCoordinate(value.y)) return null;
  const nickname = [...value.nickname.replace(CONTROL_CHARACTERS, '').trim()].slice(0, NICKNAME_DISPLAY_MAX).join('');
  if (!nickname) return null;
  return {
    id: value.id,
    nickname,
    appearance: {
      fur: pick(FUR_COLOR_IDS, value.furColor, DEFAULT_APPEARANCE.fur),
      face: pick(FACE_IDS, value.eyeId, DEFAULT_APPEARANCE.face),
      hat: pick(HAT_IDS, value.hatId, DEFAULT_APPEARANCE.hat),
    },
    position: { x: value.x, y: value.y },
  };
}

/** Parses one raw WebSocket message; returns null for anything malformed or unknown. */
export function parseWireEvent(data: unknown): WireEvent | null {
  let message: unknown;
  try {
    message = JSON.parse(String(data));
  } catch {
    return null;
  }
  if (!isObject(message)) return null;
  const { payload } = message;

  switch (message.type) {
    case 'player_joined':
    case 'player_entered': {
      const player = readPlayer(payload);
      return player ? { type: message.type, player } : null;
    }
    case 'room_state':
      // One bad entry shouldn't hide everyone else in the room.
      return Array.isArray(payload)
        ? { type: 'room_state', players: payload.map(readPlayer).filter((p): p is RoomPlayer => p !== null) }
        : null;
    case 'player_left':
      return isObject(payload) && isId(payload.id) ? { type: 'player_left', id: payload.id } : null;
    case 'player_moved':
      return isObject(payload) && isId(payload.id) && isCoordinate(payload.x) && isCoordinate(payload.y)
        ? { type: 'player_moved', id: payload.id, position: { x: payload.x, y: payload.y } }
        : null;
    case 'chat_received': {
      if (!isObject(payload) || !isId(payload.playerId) || typeof payload.text !== 'string') return null;
      const text = normalizeChatText(payload.text);
      return text && [...text].length <= SERVER_CHAT_MAX_LENGTH ? { type: 'chat_received', playerId: payload.playerId, text } : null;
    }
    default:
      return null;
  }
}

/**
 * Encodes a client event for the server, or returns null when the server has no matching
 * message. Predefined messages travel as plain chat text; emotes aren't supported yet.
 */
export function encodeClientEvent(event: ClientEvent): string | null {
  const envelope = (type: string, payload: unknown) => JSON.stringify({ type, payload });
  switch (event.type) {
    case 'join':
      return envelope('player_join', {
        nickname: event.nickname,
        furColor: event.appearance.fur,
        eyeId: event.appearance.face,
        hatId: event.appearance.hat,
      });
    case 'move':
      return envelope('player_move', { x: event.target.x, y: event.target.y });
    case 'say':
      return envelope('chat_send', { text: event.text });
    case 'chat':
      return envelope('chat_send', { text: getChatMessageText(event.messageId) });
    case 'emote':
      return null;
  }
}
