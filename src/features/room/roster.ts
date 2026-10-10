import type { ServerEvent } from '../../services/protocol';

/** Tracks who is in the room from server events; the HUD only needs the IDs to count beavers. */
export function applyRosterEvent(ids: ReadonlySet<string>, event: ServerEvent): ReadonlySet<string> {
  switch (event.type) {
    case 'welcome':
      return new Set(event.players.map((player) => player.id));
    case 'player_joined':
      return new Set(ids).add(event.player.id);
    case 'player_left': {
      const next = new Set(ids);
      next.delete(event.playerId);
      return next;
    }
    default:
      return ids;
  }
}
