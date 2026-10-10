import { describe, expect, it } from 'vitest';
import type { RoomPlayer } from '../../services/protocol';
import { applyRosterEvent } from './roster';

const beaver = (id: string): RoomPlayer => ({
  id,
  nickname: id,
  appearance: { fur: 'cream', face: 'dots', hat: 'none' },
  position: { x: 900, y: 600 },
});

describe('applyRosterEvent', () => {
  it('counts everyone from the welcome, then follows joins and leaves', () => {
    let ids = applyRosterEvent(new Set(), { type: 'welcome', selfId: 'a', players: [beaver('a'), beaver('b'), beaver('c')] });
    expect(ids.size).toBe(3);

    ids = applyRosterEvent(ids, { type: 'player_joined', player: beaver('d') });
    ids = applyRosterEvent(ids, { type: 'player_left', playerId: 'b' });
    expect([...ids].sort()).toEqual(['a', 'c', 'd']);
  });

  it('ignores events that do not change who is here', () => {
    const ids = new Set(['a']);
    expect(applyRosterEvent(ids, { type: 'chat', playerId: 'a', messageId: 'reactions.cool' })).toBe(ids);
  });
});
