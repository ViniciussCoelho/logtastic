import { describe, expect, it } from 'vitest';
import { validateNickname } from './nickname';

describe('validateNickname', () => {
  it('accepts a normal nickname and tidies its whitespace', () => {
    expect(validateNickname('  Chip   Woodbury ')).toEqual({ valid: true, nickname: 'Chip Woodbury' });
  });

  it('accepts accented letters, digits, dashes and underscores', () => {
    expect(validateNickname('Vinícius_99-Log').valid).toBe(true);
  });

  it('accepts exactly 16 characters and rejects 17', () => {
    expect(validateNickname('a'.repeat(16)).valid).toBe(true);
    expect(validateNickname('a'.repeat(17))).toEqual({ valid: false, error: expect.stringMatching(/at most 16/) });
  });

  it.each([
    ['', /pick a nickname/i],
    ['    ', /pick a nickname/i],
    ['K', /at least 2/],
    ['<script>', /only letters/],
    ['dam🦫', /only letters/],
  ])('rejects %j', (input, message) => {
    expect(validateNickname(input)).toEqual({ valid: false, error: expect.stringMatching(message) });
  });
});
