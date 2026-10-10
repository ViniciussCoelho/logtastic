import Phaser from 'phaser';

const RADIUS = 46;
const TAIL = 12;
const VISIBLE_MS = 3200;

/** A round balloon holding a beaver emote; pops in with a wiggle and fades on its own. */
export class EmoteBubble extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, y: number, textureKey: string, onGone: () => void) {
    super(scene, 0, y);

    const centerY = -TAIL - RADIUS;
    const shape = scene.add.graphics();
    shape.fillStyle(0xffffff).lineStyle(4, 0x2a1d17);
    shape.fillCircle(0, centerY, RADIUS).strokeCircle(0, centerY, RADIUS);
    shape.fillTriangle(-9, -TAIL - 4, 9, -TAIL - 4, 0, 0);
    shape.lineBetween(-9, -TAIL - 1, 0, 0).lineBetween(9, -TAIL - 1, 0, 0);
    const icon = scene.add.image(0, centerY, textureKey).setDisplaySize(RADIUS * 1.7, RADIUS * 1.7 * (70 / 68));

    this.add([shape, icon]);
    this.setScale(0.3);
    scene.tweens.add({ targets: this, scale: 1, duration: 300, ease: 'Back.Out' });
    scene.tweens.add({ targets: icon, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 3, ease: 'Sine.InOut' });
    scene.tweens.add({
      targets: this,
      alpha: 0,
      delay: VISIBLE_MS,
      duration: 300,
      onComplete: () => {
        onGone();
        this.destroy();
      },
    });
  }
}
