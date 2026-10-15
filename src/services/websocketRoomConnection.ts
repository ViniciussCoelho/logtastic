import type { ClientEvent, DisconnectReason, RoomConnection, RoomPlayer, ServerEvent } from './protocol';
import { encodeClientEvent, parseWireEvent } from './serverWire';

/**
 * The server drops anything past 20 moves a second. Clicks are paced a little under that,
 * and a burst collapses into its latest target, so the server always learns where we went.
 */
export const MOVE_INTERVAL_MS = 60;
/** The server says nothing when it refuses a join, so a silent room counts as unreachable. */
export const JOIN_TIMEOUT_MS = 10_000;

type SocketFactory = (url: string) => WebSocket;

/**
 * Connection to the Go room server over a native WebSocket. Translates the server's events
 * into the app's room events (see serverWire.ts) and reports when the room is unreachable or
 * the connection drops. No automatic reconnection.
 */
export function createWebSocketRoomConnection(url: string, createSocket: SocketFactory = (u) => new WebSocket(u)): RoomConnection {
  const socket = createSocket(url);
  const listeners = new Set<(event: ServerEvent) => void>();
  const disconnectListeners = new Set<(reason: DisconnectReason) => void>();
  const outbox: string[] = [];
  let self: RoomPlayer | null = null;
  let inRoom = false;
  let finished = false;

  let lastMoveAt = Number.NEGATIVE_INFINITY;
  let pendingMove: string | null = null;
  let moveTimer: ReturnType<typeof setTimeout> | null = null;
  const joinTimer = setTimeout(() => disconnect('unreachable'), JOIN_TIMEOUT_MS);

  const emit = (event: ServerEvent) => listeners.forEach((listener) => listener(event));

  function transmit(message: string) {
    if (socket.readyState === WebSocket.OPEN) socket.send(message);
    else if (socket.readyState === WebSocket.CONNECTING) outbox.push(message);
  }

  function stopTimers() {
    clearTimeout(joinTimer);
    if (moveTimer) clearTimeout(moveTimer);
    moveTimer = null;
  }

  function disconnect(reason: DisconnectReason) {
    if (finished) return;
    finished = true;
    stopTimers();
    disconnectListeners.forEach((listener) => listener(reason));
    socket.close();
  }

  function sendMove(message: string) {
    const wait = lastMoveAt + MOVE_INTERVAL_MS - Date.now();
    if (wait <= 0 && !moveTimer) {
      lastMoveAt = Date.now();
      transmit(message);
      return;
    }
    pendingMove = message;
    moveTimer ??= setTimeout(() => {
      moveTimer = null;
      const latest = pendingMove;
      pendingMove = null;
      if (latest) sendMove(latest);
    }, Math.max(wait, 0));
  }

  socket.addEventListener('open', () => outbox.splice(0).forEach((message) => socket.send(message)));
  socket.addEventListener('close', () => disconnect(inRoom ? 'lost' : 'unreachable'));
  socket.addEventListener('message', (message) => {
    const event = parseWireEvent(message.data);
    if (!event) {
      console.warn('[room] ignored malformed server message', message.data);
      return;
    }
    // The server confirms our join, then sends who was already here; together they are the welcome.
    if (event.type === 'player_joined') {
      self ??= event.player;
      return;
    }
    if (event.type === 'room_state') {
      if (!self || inRoom) return;
      inRoom = true;
      clearTimeout(joinTimer);
      const others = event.players.filter((player) => player.id !== self?.id);
      emit({ type: 'welcome', selfId: self.id, players: [self, ...others] });
      return;
    }
    // Nothing else makes sense before the welcome, and nothing about ourselves comes from others.
    if (!inRoom || !self) return;
    switch (event.type) {
      case 'player_entered':
        if (event.player.id !== self.id) emit({ type: 'player_joined', player: event.player });
        return;
      case 'player_left':
        if (event.id !== self.id) emit({ type: 'player_left', playerId: event.id });
        return;
      case 'player_moved':
        if (event.id !== self.id) emit({ type: 'player_moved', playerId: event.id, target: event.position });
        return;
      case 'chat_received':
        // Our own chat comes back here too; it is rendered from this echo, never on send.
        emit({ type: 'say', playerId: event.playerId, text: event.text });
        return;
    }
  });

  return {
    supportsEmotes: false,
    send: (event: ClientEvent) => {
      if (finished) return;
      const message = encodeClientEvent(event);
      if (!message) return;
      if (event.type === 'move') sendMove(message);
      else transmit(message);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onDisconnect: (listener) => {
      disconnectListeners.add(listener);
      return () => disconnectListeners.delete(listener);
    },
    close: () => {
      finished = true;
      stopTimers();
      listeners.clear();
      disconnectListeners.clear();
      socket.close();
    },
  };
}
