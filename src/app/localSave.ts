import { isAvatarAppearance } from '../features/character/appearance';
import { validateNickname } from '../features/character/nickname';
import type { PlayerProfile } from '../types/player';

/**
 * Remembers the player's beaver and room settings in this browser, so a refresh doesn't
 * send them back to an empty character screen. Saved data is untrusted: anything that no
 * longer passes the current rules (renamed hats, a hand-edited value) is ignored.
 */
const PROFILE_KEY = 'logtastic.profile';
const SETTINGS_KEY = 'logtastic.settings';

export interface RoomSettings {
  namesVisible: boolean;
  filmLook: boolean;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = { namesVisible: true, filmLook: true };

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

/** Private windows and blocked site data can make `localStorage` throw on access. */
function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(store: KeyValueStore | null, key: string): unknown {
  try {
    const raw = store?.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function write(store: KeyValueStore | null, key: string, value: unknown): void {
  try {
    store?.setItem(key, JSON.stringify(value));
  } catch {
    // Full or blocked storage only costs the player a convenience.
  }
}

export function loadProfile(store = browserStore()): PlayerProfile | null {
  const saved = read(store, PROFILE_KEY);
  if (typeof saved !== 'object' || saved === null) return null;
  const { nickname, appearance } = saved as Record<string, unknown>;
  if (typeof nickname !== 'string' || !isAvatarAppearance(appearance)) return null;
  const validation = validateNickname(nickname);
  if (!validation.valid) return null;
  return { nickname: validation.nickname, appearance: { fur: appearance.fur, face: appearance.face, hat: appearance.hat } };
}

export function saveProfile(profile: PlayerProfile, store = browserStore()): void {
  write(store, PROFILE_KEY, profile);
}

export function loadRoomSettings(store = browserStore()): RoomSettings {
  const saved = read(store, SETTINGS_KEY);
  if (typeof saved !== 'object' || saved === null) return DEFAULT_ROOM_SETTINGS;
  const { namesVisible, filmLook } = saved as Record<string, unknown>;
  return {
    namesVisible: typeof namesVisible === 'boolean' ? namesVisible : DEFAULT_ROOM_SETTINGS.namesVisible,
    filmLook: typeof filmLook === 'boolean' ? filmLook : DEFAULT_ROOM_SETTINGS.filmLook,
  };
}

export function saveRoomSettings(settings: RoomSettings, store = browserStore()): void {
  write(store, SETTINGS_KEY, settings);
}
