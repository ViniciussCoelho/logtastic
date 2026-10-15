interface ImportMetaEnv {
  /** WebSocket URL of the Go room server, e.g. ws://localhost:8080/ws. */
  readonly VITE_WS_URL?: string;
  /** "true" plays against the offline mock room instead of the server. */
  readonly VITE_ROOM_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
