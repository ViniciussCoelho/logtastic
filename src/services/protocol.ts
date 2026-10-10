/**
 * Wire contract between the frontend and the Go room server.
 * Every event is a JSON object discriminated by `type`.
 *
 * The client only sends intents: join, a move target and a chat message *ID*.
 * The server owns the roster and broadcasts what happens, including echoing the
 * sender's own chat back so every client renders bubbles from the same event.
 */
import { isAvatarAppearance, type AvatarAppearance } from '../features/character/appearance';
import { isChatMessageId, type ChatMessageId } from '../features/chat/messages';
import type { Vec2 } from '../types/geometry';

export interface RoomPlayer {
  id: string;
  nickname: string;
  appearance: AvatarAppearance;
  position: Vec2;
}

export type ClientEvent =
  | { type: 'join'; nickname: string; appearance: AvatarAppearance }
  | { type: 'move'; target: Vec2 }
  | { type: 'chat'; messageId: ChatMessageId };

export type ServerEvent =
  | { type: 'welcome'; selfId: string; players: RoomPlayer[] }
  | { type: 'player_joined'; player: RoomPlayer }
  | { type: 'player_left'; playerId: string }
  | { type: 'player_moved'; playerId: string; target: Vec2 }
  | { type: 'chat'; playerId: string; messageId: ChatMessageId };

export interface RoomConnection {
  send(event: ClientEvent): void;
  /** Returns an unsubscribe function. */
  subscribe(listener: (event: ServerEvent) => void): () => void;
  close(): void;
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isVec2 = (value: unknown): value is Vec2 =>
  isObject(value) && Number.isFinite(value.x) && Number.isFinite(value.y);

function isRoomPlayer(value: unknown): value is RoomPlayer {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.nickname) &&
    isAvatarAppearance(value.appearance) &&
    isVec2(value.position)
  );
}

/** Validates an untrusted server payload; returns null for anything malformed. */
export function parseServerEvent(raw: unknown): ServerEvent | null {
  if (!isObject(raw)) return null;
  switch (raw.type) {
    case 'welcome':
      return isString(raw.selfId) && Array.isArray(raw.players) && raw.players.every(isRoomPlayer)
        ? { type: 'welcome', selfId: raw.selfId, players: raw.players }
        : null;
    case 'player_joined':
      return isRoomPlayer(raw.player) ? { type: 'player_joined', player: raw.player } : null;
    case 'player_left':
      return isString(raw.playerId) ? { type: 'player_left', playerId: raw.playerId } : null;
    case 'player_moved':
      return isString(raw.playerId) && isVec2(raw.target)
        ? { type: 'player_moved', playerId: raw.playerId, target: { x: raw.target.x, y: raw.target.y } }
        : null;
    case 'chat':
      return isString(raw.playerId) && isChatMessageId(raw.messageId)
        ? { type: 'chat', playerId: raw.playerId, messageId: raw.messageId }
        : null;
    default:
      return null;
  }
}
