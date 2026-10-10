import { describe, expect, it } from 'vitest';
import { CHAT_CATEGORIES, CHAT_MESSAGE_IDS, getChatMessageText, isChatMessageId } from './messages';

describe('predefined chat messages', () => {
  it('offers the three MVP categories with four messages each', () => {
    expect(CHAT_CATEGORIES.map((c) => c.label)).toEqual(['Greetings', 'Social', 'Reactions']);
    expect(CHAT_CATEGORIES.map((c) => c.messages.length)).toEqual([4, 4, 4]);
  });

  it('gives every message a unique, stable ID', () => {
    expect(new Set(CHAT_MESSAGE_IDS).size).toBe(12);
    expect(CHAT_MESSAGE_IDS).toContain('social.nice-hat');
  });

  it('resolves IDs to the text shown in bubbles', () => {
    expect(getChatMessageText('greetings.nice-to-meet-you')).toBe('Nice to meet you!');
    expect(getChatMessageText('social.explore')).toBe("Let's explore!");
  });

  it('rejects anything that is not a known ID, including the message text itself', () => {
    expect(isChatMessageId('reactions.cool')).toBe(true);
    expect(isChatMessageId('Cool!')).toBe(false);
    expect(isChatMessageId('reactions.rude')).toBe(false);
    expect(isChatMessageId(42)).toBe(false);
  });
});
