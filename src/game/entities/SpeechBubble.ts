import Phaser from 'phaser';

const PADDING_X = 18;
const PADDING_Y = 10;
const TAIL = 12;
const VISIBLE_MS = 4500;

/** A cartoon speech bubble that pops in, lingers, and fades away on its own. */
export class SpeechBubble extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, y: number, text: string, onGone: () => void) {
    super(scene, 0, y);

    const label = scene.add
      .text(0, 0, text, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontStyle: '800',
        fontSize: '26px',
        color: '#2b1b13',
        align: 'center',
        // Advanced wrap also breaks long unbroken words, which free text can contain.
        wordWrap: { width: 280, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 1);
    label.y = -TAIL - PADDING_Y;

    const width = label.width + PADDING_X * 2;
    const height = label.height + PADDING_Y * 2;
    const top = -TAIL - height;
    const shape = scene.add.graphics();
    shape.fillStyle(0xffffff).lineStyle(4, 0x2b1b13);
    shape.fillRoundedRect(-width / 2, top, width, height, 18).strokeRoundedRect(-width / 2, top, width, height, 18);
    shape.fillTriangle(-10, -TAIL - 2, 10, -TAIL - 2, 0, 0);
    shape.lineBetween(-10, -TAIL, 0, 0).lineBetween(10, -TAIL, 0, 0);

    this.add([shape, label]);
    this.setScale(0.4);
    scene.tweens.add({ targets: this, scale: 1, duration: 260, ease: 'Back.Out' });
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
