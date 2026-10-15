/**
 * Beaver emotes: the most popular emojis, redrawn as beavers. Like predefined messages,
 * only the stable ID travels over the network.
 */
export const EMOTES = [
  { id: 'laugh', label: 'Laughing', emoji: '😂' },
  { id: 'love', label: 'In love', emoji: '😍' },
  { id: 'thumbs-up', label: 'Thumbs up', emoji: '👍' },
  { id: 'wow', label: 'Wow', emoji: '😮' },
  { id: 'sad', label: 'Sad', emoji: '😢' },
  { id: 'angry', label: 'Angry', emoji: '😡' },
  { id: 'cool', label: 'Cool', emoji: '😎' },
  { id: 'party', label: 'Party', emoji: '🥳' },
  { id: 'sleepy', label: 'Sleepy', emoji: '😴' },
  { id: 'think', label: 'Thinking', emoji: '🤔' },
  { id: 'wave', label: 'Waving', emoji: '👋' },
  { id: 'heart', label: 'Heart', emoji: '❤️' },
] as const;

export type Emote = (typeof EMOTES)[number];
export type EmoteId = Emote['id'];

export const EMOTE_IDS: readonly EmoteId[] = EMOTES.map((emote) => emote.id);

export function isEmoteId(value: unknown): value is EmoteId {
  return typeof value === 'string' && (EMOTE_IDS as readonly string[]).includes(value);
}

export function getEmote(id: EmoteId): Emote {
  const emote = EMOTES.find((e) => e.id === id);
  if (!emote) throw new Error(`Unknown emote: ${id}`);
  return emote;
}

/** Keys 1–9 fire the first nine emotes, in catalogue order. */
export function emoteForHotkey(key: string): EmoteId | null {
  const index = Number(key) - 1;
  return /^[1-9]$/.test(key) ? (EMOTE_IDS[index] ?? null) : null;
}
