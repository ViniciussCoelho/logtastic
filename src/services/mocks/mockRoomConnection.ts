import { CHAT_MESSAGE_IDS, isChatMessageId, type ChatMessageId } from '../../features/chat/messages';
import { DAM_LAYOUT } from '../../game/damLayout';
import { randomWalkablePoint } from '../../game/movement';
import type { ClientEvent, RoomConnection, RoomPlayer, ServerEvent } from '../protocol';
import { SIMULATED_BEAVERS, VISITING_BEAVER } from './simulatedBeavers';

/** Pretend network delay, so the UI never relies on events arriving synchronously. */
const LATENCY_MS = 60;
const VISITOR_ARRIVES_MS = 12_000;
const VISITOR_LEAVES_MS = 80_000;
const GREETING_IDS: readonly ChatMessageId[] = ['greetings.hello', 'greetings.welcome', 'greetings.nice-to-meet-you'];

interface MockOptions {
  random?: () => number;
}

/**
 * Local stand-in for the Go room server. It speaks exactly the protocol in `protocol.ts`,
 * so replacing it with a WebSocket connection changes nothing above this layer.
 */
export function createMockRoomConnection({ random = Math.random }: MockOptions = {}): RoomConnection {
  const listeners = new Set<(event: ServerEvent) => void>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const bots = new Map(SIMULATED_BEAVERS.map((bot) => [bot.id, { ...bot }]));
  let self: RoomPlayer | null = null;
  let closed = false;

  const later = (ms: number, action: () => void) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!closed) action();
    }, ms);
    timers.add(timer);
  };
  const emit = (event: ServerEvent) => later(LATENCY_MS, () => listeners.forEach((listener) => listener(event)));
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;

  function botActivity() {
    const bot = pick([...bots.values()]);
    if (random() < 0.6) {
      bot.position = randomWalkablePoint(DAM_LAYOUT, random);
      emit({ type: 'player_moved', playerId: bot.id, target: bot.position });
    } else {
      emit({ type: 'chat', playerId: bot.id, messageId: pick(CHAT_MESSAGE_IDS) });
    }
    later(2500 + random() * 3500, botActivity);
  }

  function scheduleVisitor() {
    later(VISITOR_ARRIVES_MS, () => {
      const visitor = { ...VISITING_BEAVER };
      bots.set(visitor.id, visitor);
      emit({ type: 'player_joined', player: visitor });
      later(1500, () => emit({ type: 'chat', playerId: visitor.id, messageId: 'greetings.hello' }));
      later(VISITOR_LEAVES_MS, () => {
        emit({ type: 'chat', playerId: visitor.id, messageId: 'greetings.bye' });
        later(1800, () => {
          bots.delete(visitor.id);
          emit({ type: 'player_left', playerId: visitor.id });
        });
      });
    });
  }

  /** Bots are friendly: greet them and someone greets you back. */
  function replyTo(messageId: ChatMessageId) {
    if (!GREETING_IDS.includes(messageId)) return;
    const bot = pick([...bots.values()]);
    later(1000 + random() * 1200, () => emit({ type: 'chat', playerId: bot.id, messageId: pick(GREETING_IDS) }));
  }

  function handle(event: ClientEvent) {
    switch (event.type) {
      case 'join':
        if (self) return;
        self = { id: `you-${Math.floor(random() * 1e9)}`, nickname: event.nickname, appearance: event.appearance, position: DAM_LAYOUT.spawn };
        emit({ type: 'welcome', selfId: self.id, players: [self, ...bots.values()] });
        later(2000, botActivity);
        scheduleVisitor();
        return;
      case 'move':
        // The server would broadcast this to the *other* clients; there are none here.
        if (self) self.position = event.target;
        return;
      case 'chat':
        // Mirrors server-side validation: unknown IDs are dropped, never relayed.
        if (!self || !isChatMessageId(event.messageId)) return;
        emit({ type: 'chat', playerId: self.id, messageId: event.messageId });
        replyTo(event.messageId);
        return;
    }
  }

  return {
    send: (event) => {
      if (!closed) handle(event);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => {
      closed = true;
      timers.forEach(clearTimeout);
      timers.clear();
      listeners.clear();
    },
  };
}
