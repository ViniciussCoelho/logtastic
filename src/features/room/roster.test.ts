import { describe, expect, it } from 'vitest';
import type { RoomPlayer } from '../../services/protocol';
import { applyRosterEvent } from './roster';

const beaver = (id: string): RoomPlayer => ({
  id,
  nickname: `Beaver ${id}`,
  appearance: { fur: 'cream', face: 'dots', hat: 'none' },
  position: { x: 900, y: 600 },
});

describe('applyRosterEvent', () => {
  it('starts from the welcome, then follows joins and leaves', () => {
    let roster = applyRosterEvent(new Map(), { type: 'welcome', selfId: 'a', players: [beaver('a'), beaver('b'), beaver('c')] });
    expect(roster.size).toBe(3);

    roster = applyRosterEvent(roster, { type: 'player_joined', player: beaver('d') });
    roster = applyRosterEvent(roster, { type: 'player_left', playerId: 'b' });
    expect([...roster.keys()].sort()).toEqual(['a', 'c', 'd']);
    expect(roster.get('d')).toEqual({ nickname: 'Beaver d', appearance: { fur: 'cream', face: 'dots', hat: 'none' } });
  });

  it('ignores events that do not change who is here', () => {
    const roster = new Map([['a', { nickname: 'A', appearance: beaver('a').appearance }]]);
    expect(applyRosterEvent(roster, { type: 'chat', playerId: 'a', messageId: 'reactions.cool' })).toBe(roster);
  });
});
