import { createMockRoomConnection } from './mocks/mockRoomConnection';
import type { RoomConnection } from './protocol';
import { createWebSocketRoomConnection } from './websocketRoomConnection';

const DEV_SERVER_URL = 'ws://localhost:8080/ws';

/**
 * One connection per visit to The Dam. Talks to the Go server at VITE_WS_URL (in development
 * it defaults to the local server). VITE_ROOM_MOCK=true swaps in the offline mock room.
 */
export function createRoomConnection(): RoomConnection {
  if (import.meta.env.VITE_ROOM_MOCK === 'true') return createMockRoomConnection();
  return createWebSocketRoomConnection(serverUrl());
}

function serverUrl(): string {
  const configured = import.meta.env.VITE_WS_URL;
  if (configured) return configured;
  if (import.meta.env.DEV) return DEV_SERVER_URL;
  // A production build without VITE_WS_URL assumes the server is behind the same host.
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
}
