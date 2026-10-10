export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;

const ALLOWED_CHARACTERS = /^[\p{L}\p{N} _-]+$/u;

export type NicknameValidation = { valid: true; nickname: string } | { valid: false; error: string };

/** Trims and collapses inner whitespace, so "  Chip   Log " becomes "Chip Log". */
export function normalizeNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function nicknameLength(nickname: string): number {
  return [...nickname].length;
}

export function validateNickname(raw: string): NicknameValidation {
  const nickname = normalizeNickname(raw);
  const length = nicknameLength(nickname);

  if (length === 0) return { valid: false, error: 'Pick a nickname so the other beavers know who you are.' };
  if (length < NICKNAME_MIN_LENGTH) {
    return { valid: false, error: `Nicknames need at least ${NICKNAME_MIN_LENGTH} characters.` };
  }
  if (length > NICKNAME_MAX_LENGTH) {
    return { valid: false, error: `Nicknames can have at most ${NICKNAME_MAX_LENGTH} characters.` };
  }
  if (!ALLOWED_CHARACTERS.test(nickname)) {
    return { valid: false, error: 'Use only letters, numbers, spaces, - and _.' };
  }
  return { valid: true, nickname };
}
