import type Phaser from 'phaser';
import { svgToDataUri } from '../features/character/avatar/svg';

/**
 * Rasterizes an SVG string into a Phaser canvas texture at `scale`, so art stays
 * crisp when the game canvas is scaled up on large screens.
 */
export async function addSvgTexture(scene: Phaser.Scene, key: string, svg: string, scale = 1): Promise<void> {
  if (scene.textures.exists(key)) return;
  const image = new Image();
  image.src = svgToDataUri(svg);
  await image.decode();
  // The game may have been destroyed while the image decoded (e.g. the player left).
  if (!scene.textures.game || scene.textures.exists(key)) return;

  const width = Math.ceil(image.width * scale);
  const height = Math.ceil(image.height * scale);
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) return;
  texture.getContext().drawImage(image, 0, 0, width, height);
  texture.refresh();
}
