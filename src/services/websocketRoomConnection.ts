import { parseServerEvent, type ClientEvent, type RoomConnection, type ServerEvent } from './protocol';

/** Connection to the Go room server: JSON events over a WebSocket, validated on the way in. */
export function createWebSocketRoomConnection(url: string): RoomConnection {
  const socket = new WebSocket(url);
  const listeners = new Set<(event: ServerEvent) => void>();
  const outbox: string[] = [];

  socket.addEventListener('open', () => outbox.splice(0).forEach((message) => socket.send(message)));
  socket.addEventListener('message', (message) => {
    let event: ServerEvent | null = null;
    try {
      event = parseServerEvent(JSON.parse(String(message.data)));
    } catch {
      // Not JSON; fall through to the warning below.
    }
    if (event) listeners.forEach((listener) => listener(event));
    else console.warn('[room] ignored malformed server event', message.data);
  });

  return {
    send: (event: ClientEvent) => {
      const message = JSON.stringify(event);
      if (socket.readyState === WebSocket.OPEN) socket.send(message);
      else if (socket.readyState === WebSocket.CONNECTING) outbox.push(message);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => {
      listeners.clear();
      socket.close();
    },
  };
}
