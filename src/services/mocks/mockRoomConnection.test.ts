import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DAM_LAYOUT } from '../../game/damLayout';
import { isWalkable } from '../../game/movement';
import type { ServerEvent } from '../protocol';
import { createMockRoomConnection } from './mockRoomConnection';

/** Deterministic random so bot behavior is reproducible. */
function seededRandom(seed = 42) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function joinRoom() {
  const room = createMockRoomConnection({ random: seededRandom() });
  const events: ServerEvent[] = [];
  room.subscribe((event) => events.push(event));
  room.send({ type: 'join', nickname: 'Chip', appearance: { fur: 'cream', face: 'happy', hat: 'beanie' } });
  vi.advanceTimersByTime(100);
  return { room, events };
}

describe('mock room connection', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('welcomes the player into a room with 3–5 simulated beavers', () => {
    const { events } = joinRoom();
    const welcome = events[0];
    expect(welcome?.type).toBe('welcome');
    if (welcome?.type !== 'welcome') return;

    const self = welcome.players.find((p) => p.id === welcome.selfId);
    const others = welcome.players.filter((p) => p.id !== welcome.selfId);
    expect(self).toMatchObject({ nickname: 'Chip', appearance: { fur: 'cream', face: 'happy', hat: 'beanie' } });
    expect(others.length).toBeGreaterThanOrEqual(3);
    expect(others.length).toBeLessThanOrEqual(5);
    expect(new Set(welcome.players.map((p) => p.id)).size).toBe(welcome.players.length);
    welcome.players.forEach((p) => expect(isWalkable(p.position, DAM_LAYOUT)).toBe(true));
  });

  it('echoes the player’s chat by message ID and ignores unknown IDs', () => {
    const { room, events } = joinRoom();
    const selfId = events[0]?.type === 'welcome' ? events[0].selfId : '';

    room.send({ type: 'chat', messageId: 'reactions.awesome' });
    // Simulates a tampered client sending text the server would reject.
    room.send({ type: 'chat', messageId: 'pay me 1000 coins' as never });
    vi.advanceTimersByTime(100);

    const chats = events.filter((e) => e.type === 'chat' && e.playerId === selfId);
    expect(chats).toEqual([{ type: 'chat', playerId: selfId, messageId: 'reactions.awesome' }]);
  });

  it('relays typed chat and emotes under the same rules as the real server', () => {
    const { room, events } = joinRoom();
    const selfId = events[0]?.type === 'welcome' ? events[0].selfId : '';

    room.send({ type: 'say', text: '  bora   construir? ' });
    room.send({ type: 'say', text: 'x'.repeat(200) });
    room.send({ type: 'emote', emoteId: 'cool' });
    vi.advanceTimersByTime(100);

    const mine = events.filter((e) => 'playerId' in e && e.playerId === selfId);
    expect(mine).toEqual([
      { type: 'say', playerId: selfId, text: 'bora construir?' },
      { type: 'emote', playerId: selfId, emoteId: 'cool' },
    ]);
  });

  it('keeps simulated beavers moving to walkable spots and chatting', () => {
    const { events } = joinRoom();
    vi.advanceTimersByTime(60_000);

    const targets = events.flatMap((e) => (e.type === 'player_moved' ? [e.target] : []));
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.filter((target) => !isWalkable(target, DAM_LAYOUT))).toEqual([]);
    expect(events.some((e) => e.type === 'chat')).toBe(true);
    expect(events.some((e) => e.type === 'player_joined')).toBe(true);
  });

  it('goes quiet once closed', () => {
    const { room, events } = joinRoom();
    room.close();
    const count = events.length;
    vi.advanceTimersByTime(60_000);
    expect(events.length).toBe(count);
  });
});
