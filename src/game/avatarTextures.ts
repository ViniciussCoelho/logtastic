import type Phaser from 'phaser';
import { getFurColor, type AvatarAppearance, type FaceId, type FurColorId, type HatId } from '../features/character/appearance';
import { renderBodyLayer } from '../features/character/avatar/beaverBody';
import { renderHatLayer } from '../features/character/avatar/hats';
import { DIRECTIONS, type Direction, type WalkStep } from '../features/character/avatar/pose';
import { addSvgTexture } from './svgTexture';

/** Avatar textures are rasterized at 2x and drawn at half size. */
export const AVATAR_TEXTURE_SCALE = 2;

const STEPS: readonly WalkStep[] = [0, 1, 2];

export const bodyTextureKey = (fur: FurColorId, face: FaceId, direction: Direction, step: WalkStep, blink: boolean): string =>
  `beaver:${fur}:${face}:${direction}:${step}${blink ? ':blink' : ''}`;

export const hatTextureKey = (hat: HatId, direction: Direction, step: WalkStep): string =>
  `hat:${hat}:${direction}:${step}`;

/**
 * Builds every frame an appearance needs from the shared avatar renderer, once per fur and face
 * combination and once per hat, no matter how many beavers wear them.
 */
export class AvatarTextures {
  private readonly pending = new Map<string, Promise<void>>();

  constructor(private readonly scene: Phaser.Scene) {}

  ensure(appearance: AvatarAppearance): Promise<void> {
    return Promise.all([this.ensureBody(appearance.fur, appearance.face), this.ensureHat(appearance.hat)]).then(() => undefined);
  }

  private once(key: string, build: () => Promise<unknown>): Promise<void> {
    let promise = this.pending.get(key);
    if (!promise) {
      promise = build().then(() => undefined);
      this.pending.set(key, promise);
    }
    return promise;
  }

  private ensureBody(fur: FurColorId, face: FaceId): Promise<void> {
    return this.once(`body:${fur}:${face}`, () => {
      const palette = getFurColor(fur).palette;
      const frames = DIRECTIONS.flatMap((direction) => [
        ...STEPS.map((step) => ({ direction, step, blink: false })),
        { direction, step: 0 as WalkStep, blink: true },
      ]);
      return Promise.all(
        frames.map((pose) =>
          addSvgTexture(this.scene, bodyTextureKey(fur, face, pose.direction, pose.step, pose.blink), renderBodyLayer(palette, face, pose), AVATAR_TEXTURE_SCALE),
        ),
      );
    });
  }

  private ensureHat(hat: HatId): Promise<void> {
    if (hat === 'none') return Promise.resolve();
    return this.once(`hat:${hat}`, () =>
      Promise.all(
        DIRECTIONS.flatMap((direction) =>
          STEPS.map((step) => {
            const svg = renderHatLayer(hat, { direction, step, blink: false });
            return svg ? addSvgTexture(this.scene, hatTextureKey(hat, direction, step), svg, AVATAR_TEXTURE_SCALE) : undefined;
          }),
        ),
      ),
    );
  }
}
