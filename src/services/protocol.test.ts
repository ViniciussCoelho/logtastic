import { describe, expect, it } from 'vitest';
import { parseServerEvent } from './protocol';

const player = { id: 'p1', nickname: 'Maple', appearance: { fur: 'cream', face: 'cool', hat: 'beanie' }, position: { x: 900, y: 600 } };

describe('parseServerEvent', () => {
  it('accepts well-formed events', () => {
    expect(parseServerEvent({ type: 'welcome', selfId: 'p1', players: [player] })).toEqual({
      type: 'welcome',
      selfId: 'p1',
      players: [player],
    });
    expect(parseServerEvent({ type: 'chat', playerId: 'p1', messageId: 'reactions.haha' })).toEqual({
      type: 'chat',
      playerId: 'p1',
      messageId: 'reactions.haha',
    });
  });

  it('drops chat that carries free text instead of a known message ID', () => {
    expect(parseServerEvent({ type: 'chat', playerId: 'p1', messageId: 'anything I want' })).toBeNull();
    expect(parseServerEvent({ type: 'chat', playerId: 'p1', text: 'Hello!' })).toBeNull();
  });

  it('drops players with unknown appearance or broken positions', () => {
    expect(parseServerEvent({ type: 'player_joined', player: { ...player, appearance: { fur: 'neon', face: 'dots', hat: 'none' } } })).toBeNull();
    expect(parseServerEvent({ type: 'player_moved', playerId: 'p1', target: { x: 'left', y: 3 } })).toBeNull();
  });

  it('drops unknown event types and non-objects', () => {
    expect(parseServerEvent({ type: 'teleport', playerId: 'p1' })).toBeNull();
    expect(parseServerEvent('welcome')).toBeNull();
    expect(parseServerEvent(null)).toBeNull();
  });
});
