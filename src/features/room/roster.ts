import type { RoomPlayer, ServerEvent } from '../../services/protocol';

/** What the HUD and chat history need to know about someone in the room. */
export type RosterEntry = Pick<RoomPlayer, 'nickname' | 'appearance'>;
export type Roster = ReadonlyMap<string, RosterEntry>;

const entry = ({ nickname, appearance }: RoomPlayer): RosterEntry => ({ nickname, appearance });

/** Who is in the room, by player ID, followed from server events. */
export function applyRosterEvent(roster: Roster, event: ServerEvent): Roster {
  switch (event.type) {
    case 'welcome':
      return new Map(event.players.map((player) => [player.id, entry(player)]));
    case 'player_joined':
      return new Map(roster).set(event.player.id, entry(event.player));
    case 'player_left': {
      const next = new Map(roster);
      next.delete(event.playerId);
      return next;
    }
    default:
      return roster;
  }
}
