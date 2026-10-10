import { getFurColor, type AvatarAppearance } from '../appearance';
import { renderBodyLayer } from './beaverBody';
import { renderHatLayer } from './hats';
import type { AvatarPose } from './pose';

/**
 * The one avatar renderer. The character screen stacks these layers as images;
 * the game will register the same SVGs as Phaser textures. Layers are separate
 * so accessories (only hats for now) never have to be baked into the body.
 */
export interface AvatarLayers {
  body: string;
  hat: string | null;
}

export function renderAvatarLayers(appearance: AvatarAppearance, pose: AvatarPose): AvatarLayers {
  return {
    body: renderBodyLayer(getFurColor(appearance.fur).palette, appearance.face, pose),
    hat: renderHatLayer(appearance.hat, pose),
  };
}
