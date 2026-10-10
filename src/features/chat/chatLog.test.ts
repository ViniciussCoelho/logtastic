import { describe, expect, it } from 'vitest';
import type { Roster } from '../room/roster';
import { applyChatLogEvent, CHAT_LOG_LIMIT, EMPTY_CHAT_LOG } from './chatLog';

const roster: Roster = new Map([['p1', { nickname: 'Maple', appearance: { fur: 'ash-gray', face: 'dots', hat: 'none' } }]]);

describe('applyChatLogEvent', () => {
  it('records predefined messages as their text, typed messages verbatim and emotes in the sender’s fur', () => {
    let log = applyChatLogEvent(EMPTY_CHAT_LOG, { type: 'chat', playerId: 'p1', messageId: 'social.nice-hat' }, roster);
    log = applyChatLogEvent(log, { type: 'say', playerId: 'p1', text: 'bora nadar?' }, roster);
    log = applyChatLogEvent(log, { type: 'emote', playerId: 'p1', emoteId: 'cool' }, roster);

    expect(log.entries).toEqual([
      { key: 0, playerId: 'p1', nickname: 'Maple', kind: 'text', text: 'Nice hat!' },
      { key: 1, playerId: 'p1', nickname: 'Maple', kind: 'text', text: 'bora nadar?' },
      { key: 2, playerId: 'p1', nickname: 'Maple', kind: 'emote', emoteId: 'cool', fur: 'ash-gray' },
    ]);
  });

  it('still logs a line when the sender is not in the roster', () => {
    const log = applyChatLogEvent(EMPTY_CHAT_LOG, { type: 'say', playerId: 'ghost', text: 'boo' }, roster);
    expect(log.entries[0]).toMatchObject({ nickname: 'A beaver', text: 'boo' });
  });

  it('keeps only the most recent lines', () => {
    let log = EMPTY_CHAT_LOG;
    for (let i = 0; i < CHAT_LOG_LIMIT + 5; i++) log = applyChatLogEvent(log, { type: 'say', playerId: 'p1', text: `line ${i}` }, roster);
    expect(log.entries).toHaveLength(CHAT_LOG_LIMIT);
    expect(log.entries[0]).toMatchObject({ text: 'line 5' });
    expect(log.entries.at(-1)).toMatchObject({ text: `line ${CHAT_LOG_LIMIT + 4}` });
  });

  it('ignores events that are not chat', () => {
    expect(applyChatLogEvent(EMPTY_CHAT_LOG, { type: 'player_left', playerId: 'p1' }, roster)).toBe(EMPTY_CHAT_LOG);
  });
});
