import type { AvatarAppearance } from '../features/character/appearance';

/** What the local player chose on the character screen. */
export interface PlayerProfile {
  nickname: string;
  appearance: AvatarAppearance;
}
