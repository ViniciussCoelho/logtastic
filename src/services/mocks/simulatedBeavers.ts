import type { RoomPlayer } from '../protocol';

/** The regulars hanging out at The Dam while the real server doesn't exist yet. */
export const SIMULATED_BEAVERS: readonly RoomPlayer[] = [
  { id: 'sim-maple', nickname: 'Maple', appearance: { fur: 'golden-brown', face: 'happy', hat: 'straw-hat' }, position: { x: 500, y: 610 } },
  { id: 'sim-birch', nickname: 'Birchwood', appearance: { fur: 'ash-gray', face: 'cool', hat: 'explorer-hat' }, position: { x: 1180, y: 610 } },
  { id: 'sim-pip', nickname: 'Pip', appearance: { fur: 'cream', face: 'sparkle', hat: 'beanie' }, position: { x: 1460, y: 620 } },
  { id: 'sim-hazel', nickname: 'Hazel', appearance: { fur: 'dark-chocolate', face: 'dots', hat: 'none' }, position: { x: 880, y: 760 } },
];

/** Drops by a little after you arrive, and wanders off later. */
export const VISITING_BEAVER: RoomPlayer = {
  id: 'sim-acorn',
  nickname: 'Acorn',
  appearance: { fur: 'classic-brown', face: 'wink', hat: 'baseball-cap' },
  position: { x: 1600, y: 640 },
};
