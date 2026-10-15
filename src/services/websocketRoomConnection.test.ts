import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DisconnectReason, ServerEvent } from './protocol';
import { JOIN_TIMEOUT_MS, MOVE_INTERVAL_MS, createWebSocketRoomConnection } from './websocketRoomConnection';

/** Just enough of a browser WebSocket to play the server's side. */
class FakeSocket extends EventTarget {
  readyState: number = WebSocket.CONNECTING;
  readonly sent: { type: string; payload: unknown }[] = [];

  send(data: string) {
    this.sent.push(JSON.parse(data) as { type: string; payload: unknown });
  }
  close() {
    if (this.readyState === WebSocket.CLOSED) return;
    this.readyState = WebSocket.CLOSED;
    this.dispatchEvent(new Event('close'));
  }
  open() {
    this.readyState = WebSocket.OPEN;
    this.dispatchEvent(new Event('open'));
  }
  receive(type: string, payload: unknown) {
    this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type, payload }) }));
  }
}

const me = { id: 'me', nickname: 'Chip', furColor: 'classic-brown', eyeId: 'dots', hatId: 'none', x: 0, y: 0 };
const maple = { id: 'maple', nickname: 'Maple', furColor: 'cream', eyeId: 'wink', hatId: 'beanie', x: 900, y: 600 };

function connect() {
  const socket = new FakeSocket();
  const room = createWebSocketRoomConnection('ws://test/ws', () => socket as unknown as WebSocket);
  const events: ServerEvent[] = [];
  const disconnects: DisconnectReason[] = [];
  room.subscribe((event) => events.push(event));
  room.onDisconnect((reason) => disconnects.push(reason));
  const enterRoom = (others: unknown[] = [maple]) => {
    socket.open();
    room.send({ type: 'join', nickname: 'Chip', appearance: { fur: 'classic-brown', face: 'dots', hat: 'none' } });
    socket.receive('player_joined', me);
    socket.receive('room_state', others);
  };
  return { socket, room, events, disconnects, enterRoom };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('WebSocket room connection', () => {
  it('holds the join until the socket opens', () => {
    const { socket, room } = connect();
    room.send({ type: 'join', nickname: 'Chip', appearance: { fur: 'cream', face: 'dots', hat: 'none' } });
    expect(socket.sent).toEqual([]);
    socket.open();
    expect(socket.sent).toEqual([{ type: 'player_join', payload: { nickname: 'Chip', furColor: 'cream', eyeId: 'dots', hatId: 'none' } }]);
  });

  it('welcomes us once the server confirms the join and lists who is here', () => {
    const { socket, events } = connect();
    socket.open();
    socket.receive('player_joined', me);
    expect(events).toEqual([]);
    socket.receive('room_state', [maple]);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: 'welcome',
      selfId: 'me',
      players: [{ id: 'me', nickname: 'Chip' }, { id: 'maple', nickname: 'Maple', position: { x: 900, y: 600 } }],
    });
  });

  it('translates what other beavers do, and never removes or moves us on their word', () => {
    const { socket, events, enterRoom } = connect();
    enterRoom([]);
    events.length = 0;

    socket.receive('player_entered', maple);
    socket.receive('player_moved', { id: 'maple', x: 150, y: 250 });
    socket.receive('player_left', { id: 'maple' });
    socket.receive('player_moved', { id: 'me', x: 1, y: 1 });
    socket.receive('player_left', { id: 'me' });
    socket.receive('player_entered', me);

    expect(events).toEqual([
      expect.objectContaining({ type: 'player_joined', player: expect.objectContaining({ id: 'maple' }) }),
      { type: 'player_moved', playerId: 'maple', target: { x: 150, y: 250 } },
      { type: 'player_left', playerId: 'maple' },
    ]);
  });

  it('shows our own chat once, from the server echo, and sends quick messages as text', () => {
    const { socket, room, events, enterRoom } = connect();
    enterRoom();
    events.length = 0;

    room.send({ type: 'say', text: 'Hello, Bucky!' });
    expect(events).toEqual([]);
    socket.receive('chat_received', { playerId: 'me', nickname: 'Chip', text: 'Hello, Bucky!' });
    expect(events).toEqual([{ type: 'say', playerId: 'me', text: 'Hello, Bucky!' }]);

    room.send({ type: 'chat', messageId: 'greetings.hello' });
    expect(socket.sent.at(-1)).toEqual({ type: 'chat_send', payload: { text: 'Hello!' } });
  });

  it('paces moves under the server limit and keeps the latest target of a burst', () => {
    const { socket, room, enterRoom } = connect();
    enterRoom();
    const moves = () => socket.sent.filter((m) => m.type === 'player_move').map((m) => m.payload);

    [100, 200, 300, 400].forEach((x) => room.send({ type: 'move', target: { x, y: 500 } }));
    expect(moves()).toEqual([{ x: 100, y: 500 }]);
    vi.advanceTimersByTime(MOVE_INTERVAL_MS);
    expect(moves()).toEqual([{ x: 100, y: 500 }, { x: 400, y: 500 }]);
    vi.advanceTimersByTime(1000);
    expect(moves()).toHaveLength(2);

    // A steady stream never exceeds 20 moves in any second.
    for (let i = 0; i < 100; i++) {
      room.send({ type: 'move', target: { x: i, y: 500 } });
      vi.advanceTimersByTime(10);
    }
    expect(moves().length - 2).toBeLessThanOrEqual(20);
  });

  it('does not send emotes, which the server does not support', () => {
    const { socket, room, enterRoom } = connect();
    enterRoom();
    const before = socket.sent.length;
    room.send({ type: 'emote', emoteId: 'party' });
    expect(room.supportsEmotes).toBe(false);
    expect(socket.sent).toHaveLength(before);
  });

  it('reports an unreachable room when the socket closes before we are in', () => {
    const { socket, disconnects } = connect();
    socket.close();
    expect(disconnects).toEqual(['unreachable']);
  });

  it('reports an unreachable room when the server never answers the join', () => {
    const { socket, room, disconnects } = connect();
    socket.open();
    room.send({ type: 'join', nickname: 'Chip', appearance: { fur: 'cream', face: 'dots', hat: 'none' } });
    vi.advanceTimersByTime(JOIN_TIMEOUT_MS);
    expect(disconnects).toEqual(['unreachable']);
    expect(socket.readyState).toBe(WebSocket.CLOSED);
  });

  it('reports a lost connection once, when it drops after we are in', () => {
    const { socket, disconnects, enterRoom } = connect();
    enterRoom();
    vi.advanceTimersByTime(JOIN_TIMEOUT_MS);
    expect(disconnects).toEqual([]);
    socket.close();
    socket.dispatchEvent(new Event('close'));
    expect(disconnects).toEqual(['lost']);
  });

  it('stays quiet after we close it ourselves', () => {
    const { socket, room, events, disconnects, enterRoom } = connect();
    enterRoom();
    room.close();
    socket.receive('player_entered', maple);
    expect(disconnects).toEqual([]);
    expect(events.filter((e) => e.type === 'player_joined')).toEqual([]);
  });

  it('ignores malformed messages without breaking', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { socket, events, enterRoom } = connect();
    socket.dispatchEvent(new MessageEvent('message', { data: '{oops' }));
    enterRoom([]);
    expect(events).toHaveLength(1);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
