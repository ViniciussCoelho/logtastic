/**
 * The room events the app speaks, whichever room it is connected to. The scene and HUD only
 * see these; each connection translates its own transport into them (the Go server's wire
 * format lives in serverWire.ts).
 *
 * The client only sends intents: join, a move target, a predefined chat message ID,
 * free text (`say`) or an emote ID. The room owns the roster and reports what happens,
 * including echoing the sender's own chat back, so every client renders bubbles from the
 * same event and nothing is shown twice.
 */
import type { AvatarAppearance } from '../features/character/appearance';
import type { EmoteId } from '../features/chat/emotes';
import type { ChatMessageId } from '../features/chat/messages';
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
  | { type: 'chat'; messageId: ChatMessageId }
  | { type: 'say'; text: string }
  | { type: 'emote'; emoteId: EmoteId };

export type ServerEvent =
  | { type: 'welcome'; selfId: string; players: RoomPlayer[] }
  | { type: 'player_joined'; player: RoomPlayer }
  | { type: 'player_left'; playerId: string }
  | { type: 'player_moved'; playerId: string; target: Vec2 }
  | { type: 'chat'; playerId: string; messageId: ChatMessageId }
  | { type: 'say'; playerId: string; text: string }
  | { type: 'emote'; playerId: string; emoteId: EmoteId };

/** `unreachable`: never got into the room. `lost`: was in the room, then the connection dropped. */
export type DisconnectReason = 'unreachable' | 'lost';

export interface RoomConnection {
  /** Whether the room relays beaver emotes (the Go server doesn't yet). */
  readonly supportsEmotes: boolean;
  send(event: ClientEvent): void;
  /** Returns an unsubscribe function. */
  subscribe(listener: (event: ServerEvent) => void): () => void;
  /** Called at most once, when the room can't be reached or the connection drops. Not called after close(). */
  onDisconnect(listener: (reason: DisconnectReason) => void): () => void;
  close(): void;
}
