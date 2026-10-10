/**
 * The predefined chat catalogue. Only message IDs travel over the network;
 * every client (and later the Go server) resolves them against this list.
 */
export const CHAT_CATEGORIES = [
  {
    id: 'greetings',
    label: 'Greetings',
    messages: [
      { id: 'greetings.hello', text: 'Hello!' },
      { id: 'greetings.welcome', text: 'Welcome!' },
      { id: 'greetings.nice-to-meet-you', text: 'Nice to meet you!' },
      { id: 'greetings.bye', text: 'Bye!' },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    messages: [
      { id: 'social.how-are-you', text: 'How are you?' },
      { id: 'social.hang-out', text: 'Want to hang out?' },
      { id: 'social.nice-hat', text: 'Nice hat!' },
      { id: 'social.explore', text: "Let's explore!" },
    ],
  },
  {
    id: 'reactions',
    label: 'Reactions',
    messages: [
      { id: 'reactions.haha', text: 'Haha!' },
      { id: 'reactions.awesome', text: 'Awesome!' },
      { id: 'reactions.thanks', text: 'Thanks!' },
      { id: 'reactions.cool', text: 'Cool!' },
    ],
  },
] as const;

export type ChatCategory = (typeof CHAT_CATEGORIES)[number];
export type ChatCategoryId = ChatCategory['id'];
export type ChatMessage = ChatCategory['messages'][number];
export type ChatMessageId = ChatMessage['id'];

const MESSAGES_BY_ID: ReadonlyMap<string, ChatMessage> = new Map(
  CHAT_CATEGORIES.flatMap((category) => category.messages.map((message) => [message.id, message] as const)),
);

export const CHAT_MESSAGE_IDS: readonly ChatMessageId[] = [...MESSAGES_BY_ID.keys()] as ChatMessageId[];

export function isChatMessageId(value: unknown): value is ChatMessageId {
  return typeof value === 'string' && MESSAGES_BY_ID.has(value);
}

export function getChatMessageText(id: ChatMessageId): string {
  const message = MESSAGES_BY_ID.get(id);
  if (!message) throw new Error(`Unknown chat message: ${id}`);
  return message.text;
}
