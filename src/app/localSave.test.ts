import { describe, expect, it } from 'vitest';
import { DEFAULT_ROOM_SETTINGS, loadProfile, loadRoomSettings, saveProfile, saveRoomSettings } from './localSave';

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

const brokenStore = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
};

describe('saved profile', () => {
  it('comes back exactly as it was saved', () => {
    const store = memoryStore();
    const profile = { nickname: 'Chip Log', appearance: { fur: 'cream', face: 'wink', hat: 'beanie' } } as const;
    saveProfile(profile, store);
    expect(loadProfile(store)).toEqual(profile);
  });

  it.each([
    ['nothing saved', {}],
    ['corrupted JSON', { 'logtastic.profile': '{nope' }],
    ['a hat that no longer exists', { 'logtastic.profile': '{"nickname":"Chip","appearance":{"fur":"cream","face":"dots","hat":"crown"}}' }],
    ['a nickname that breaks the rules', { 'logtastic.profile': '{"nickname":"<b>","appearance":{"fur":"cream","face":"dots","hat":"none"}}' }],
  ])('is ignored when there is %s', (_case, initial) => {
    expect(loadProfile(memoryStore(initial))).toBeNull();
  });

  it('survives storage that throws', () => {
    expect(() => saveProfile({ nickname: 'Chip', appearance: { fur: 'cream', face: 'dots', hat: 'none' } }, brokenStore)).not.toThrow();
    expect(loadProfile(brokenStore)).toBeNull();
  });
});

describe('saved room settings', () => {
  it('round-trips and falls back per field', () => {
    const store = memoryStore();
    saveRoomSettings({ namesVisible: false, filmLook: false }, store);
    expect(loadRoomSettings(store)).toEqual({ namesVisible: false, filmLook: false });

    expect(loadRoomSettings(memoryStore({ 'logtastic.settings': '{"filmLook":false,"namesVisible":"yes"}' }))).toEqual({
      namesVisible: true,
      filmLook: false,
    });
    expect(loadRoomSettings(brokenStore)).toEqual(DEFAULT_ROOM_SETTINGS);
  });
});
