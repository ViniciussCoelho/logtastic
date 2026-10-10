/**
 * Rules for typed chat. The client applies them for quick feedback; the server must apply
 * the same rules (plus moderation) because a modified client can send anything.
 */
export const CHAT_TEXT_MAX_LENGTH = 80;

/** Control characters (except none we want) are stripped; whitespace collapses to single spaces. */
const CONTROL_CHARACTERS = /\p{Cc}|\p{Cf}/gu;

export function normalizeChatText(raw: string): string {
  return raw.replace(CONTROL_CHARACTERS, '').replace(/\s+/g, ' ').trim();
}

export type ChatTextValidation = { valid: true; text: string } | { valid: false; error: string };

export function validateChatText(raw: string): ChatTextValidation {
  const text = normalizeChatText(raw);
  if (text.length === 0) return { valid: false, error: 'Type something first.' };
  if ([...text].length > CHAT_TEXT_MAX_LENGTH) {
    return { valid: false, error: `Messages can have at most ${CHAT_TEXT_MAX_LENGTH} characters.` };
  }
  return { valid: true, text };
}
