import { describe, expect, it } from 'vitest';
import { CHAT_TEXT_MAX_LENGTH, validateChatText } from './freeText';

describe('validateChatText', () => {
  it('tidies whitespace and keeps accents and emoji', () => {
    expect(validateChatText('  oi   galera,\n tudo bem? 🦫 ')).toEqual({ valid: true, text: 'oi galera, tudo bem? 🦫' });
  });

  it('strips invisible control characters', () => {
    expect(validateChatText('hi\u0000​there')).toEqual({ valid: true, text: 'hithere' });
  });

  it('rejects empty and whitespace-only messages', () => {
    expect(validateChatText('   ').valid).toBe(false);
    expect(validateChatText('​').valid).toBe(false);
  });

  it('counts characters, not UTF-16 units, at the length limit', () => {
    expect(validateChatText('🦫'.repeat(CHAT_TEXT_MAX_LENGTH)).valid).toBe(true);
    expect(validateChatText('a'.repeat(CHAT_TEXT_MAX_LENGTH + 1)).valid).toBe(false);
  });
});
