export const DIRECTIONS = ['front', 'right', 'back', 'left'] as const;
export type Direction = (typeof DIRECTIONS)[number];

/** 0 = standing, 1 and 2 = alternating strides of the walk cycle. */
export type WalkStep = 0 | 1 | 2;

export interface AvatarPose {
  direction: Direction;
  step: WalkStep;
  blink: boolean;
}

/** Every avatar layer shares this canvas so layers stack pixel-perfectly. */
export const AVATAR_WIDTH = 120;
export const AVATAR_HEIGHT = 150;

export const IDLE_POSE: AvatarPose = { direction: 'front', step: 0, blink: false };

/** Vertical offset of the upper body (and hat) for a walk step. */
export function strideBob(step: WalkStep): number {
  return step === 0 ? 0 : -2;
}
