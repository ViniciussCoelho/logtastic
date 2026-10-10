import { createMockRoomConnection } from './mocks/mockRoomConnection';
import type { RoomConnection } from './protocol';
import { createWebSocketRoomConnection } from './websocketRoomConnection';

/** Uses the Go server when VITE_ROOM_URL is set (e.g. ws://localhost:8080/rooms/dam), the local mock otherwise. */
export function createRoomConnection(): RoomConnection {
  const url = import.meta.env.VITE_ROOM_URL as string | undefined;
  return url ? createWebSocketRoomConnection(url) : createMockRoomConnection();
}
