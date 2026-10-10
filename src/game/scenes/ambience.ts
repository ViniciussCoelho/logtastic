import Phaser from 'phaser';
import { LEAF_SOURCE, POND_BAND, RIVER_BAND, SKY_LANE, SPILLWAY } from '../art/damBackdrop';

/** Everything that keeps The Dam gently moving. Sits just above the painted backdrop. */
const AMBIENT_DEPTH = 1;

function makeTexture(scene: Phaser.Scene, key: string, width: number, height: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const graphics = scene.make.graphics({}, false);
  draw(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

function addClouds(scene: Phaser.Scene) {
  makeTexture(scene, 'cloud', 230, 100, (g) => {
    // Ink silhouette first, then the white puffs inset, so the cloud reads as outlined.
    g.fillStyle(0x2a1d17);
    g.fillCircle(62, 58, 38).fillCircle(107, 43, 44).fillCircle(152, 55, 36).fillCircle(188, 65, 26);
    g.fillRoundedRect(28, 56, 184, 40, 18);
    g.fillStyle(0xffffff);
    g.fillCircle(62, 58, 34).fillCircle(107, 43, 40).fillCircle(152, 55, 32).fillCircle(188, 65, 22);
    g.fillRoundedRect(32, 58, 176, 34, 16);
    g.fillStyle(0xcfe9f7).fillRoundedRect(40, 78, 160, 12, 6);
  });
  [
    { y: SKY_LANE.top + 40, scale: 0.9, speed: 9 },
    { y: SKY_LANE.bottom - 20, scale: 0.65, speed: 6 },
    { y: SKY_LANE.top + 10, scale: 0.5, speed: 12 },
  ].forEach(({ y, scale, speed }, i) => {
    const cloud = scene.add.image(SKY_LANE.left + i * 340, y, 'cloud').setScale(scale).setDepth(AMBIENT_DEPTH);
    scene.events.on(Phaser.Scenes.Events.UPDATE, (_: number, delta: number) => {
      cloud.x += (speed * delta) / 1000;
      if (cloud.x > SKY_LANE.right) cloud.x = SKY_LANE.left;
      // Fade near the trees so clouds never cross the canopies.
      const edge = Math.min(cloud.x - SKY_LANE.left, SKY_LANE.right - cloud.x);
      cloud.setAlpha(Phaser.Math.Clamp(edge / 140, 0, 0.9));
    });
  });
}

function addSpillway(scene: Phaser.Scene) {
  makeTexture(scene, 'falls', 64, 64, (g) => {
    g.fillStyle(0x2f8fd0).fillRect(0, 0, 64, 64);
    g.fillStyle(0xd6f2fd);
    [4, 22, 40, 54].forEach((x, i) => g.fillRoundedRect(x, (i * 17) % 64, 5, 26, 2.5));
    g.fillStyle(0x8fd6f2);
    [13, 31, 47].forEach((x, i) => g.fillRoundedRect(x, (i * 23 + 30) % 64, 4, 18, 2));
  });
  const falls = scene.add
    .tileSprite(SPILLWAY.x, SPILLWAY.y, SPILLWAY.width, SPILLWAY.height + 8, 'falls')
    .setOrigin(0)
    .setDepth(AMBIENT_DEPTH);
  scene.events.on(Phaser.Scenes.Events.UPDATE, (_: number, delta: number) => {
    falls.tilePositionY -= delta * 0.18;
  });

  // Foam where the water lands.
  for (let i = 0; i < 6; i++) {
    const foam = scene.add
      .ellipse(SPILLWAY.x + 20 + i * 32, SPILLWAY.y + SPILLWAY.height + 4, 46, 20, 0xffffff)
      .setDepth(AMBIENT_DEPTH);
    scene.tweens.add({
      targets: foam,
      scaleX: 1.25,
      scaleY: 0.8,
      duration: 420 + i * 60,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }
}

function addPondShimmer(scene: Phaser.Scene) {
  for (let i = 0; i < 14; i++) {
    const glint = scene.add
      .rectangle(
        Phaser.Math.Between(240, 1680),
        Phaser.Math.Between(POND_BAND.top + 6, POND_BAND.bottom),
        Phaser.Math.Between(16, 40),
        4,
        0xffffff,
      )
      .setAlpha(0)
      .setDepth(AMBIENT_DEPTH);
    scene.tweens.add({
      targets: glint,
      alpha: 0.85,
      x: glint.x + 14,
      duration: Phaser.Math.Between(900, 1600),
      yoyo: true,
      repeat: -1,
      delay: Phaser.Math.Between(0, 2400),
      ease: 'Sine.InOut',
    });
  }
}

function addRiverRipples(scene: Phaser.Scene) {
  scene.time.addEvent({
    delay: 260,
    loop: true,
    callback: () => {
      const ripple = scene.add
        .ellipse(Phaser.Math.Between(220, 1700), Phaser.Math.Between(RIVER_BAND.top + 10, RIVER_BAND.bottom - 30), 46, 8)
        .setStrokeStyle(3, 0xdff7ff, 0.9)
        .setDepth(AMBIENT_DEPTH)
        .setAlpha(0);
      scene.tweens.add({ targets: ripple, alpha: 0.8, duration: 650, yoyo: true });
      scene.tweens.add({
        targets: ripple,
        y: ripple.y + 26,
        scaleX: 1.6,
        duration: 1300,
        onComplete: () => ripple.destroy(),
      });
    },
  });
}

function addFallingLeaves(scene: Phaser.Scene) {
  makeTexture(scene, 'leaf', 24, 14, (g) => {
    g.fillStyle(0x64c25a).fillEllipse(12, 7, 22, 11);
    g.lineStyle(2, 0x3d8a3a).lineBetween(3, 7, 21, 7);
  });
  scene.time.addEvent({
    delay: 1700,
    loop: true,
    callback: () => {
      const x = Phaser.Math.Between(LEAF_SOURCE.left, LEAF_SOURCE.right);
      const leaf = scene.add.image(x, Phaser.Math.Between(LEAF_SOURCE.top, LEAF_SOURCE.bottom), 'leaf').setDepth(AMBIENT_DEPTH);
      scene.tweens.add({
        targets: leaf,
        y: leaf.y + Phaser.Math.Between(260, 420),
        x: leaf.x - 90,
        angle: Phaser.Math.Between(-200, 200),
        alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(4200, 6000),
        ease: 'Sine.InOut',
        onComplete: () => leaf.destroy(),
      });
    },
  });
}

/** Soft warm halo for a lantern; flickers a little even in daylight. */
export function addLanternGlow(scene: Phaser.Scene, x: number, y: number, depth: number) {
  if (!scene.textures.exists('glow')) {
    const texture = scene.textures.createCanvas('glow', 128, 128);
    if (texture) {
      const ctx = texture.getContext();
      const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255, 220, 130, 0.9)');
      gradient.addColorStop(1, 'rgba(255, 220, 130, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
      texture.refresh();
    }
  }
  const glow = scene.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setDepth(depth);
  scene.tweens.add({
    targets: glow,
    alpha: 0.3,
    scale: 0.92,
    duration: Phaser.Math.Between(380, 700),
    yoyo: true,
    repeat: -1,
    ease: 'Sine.InOut',
  });
}

export function addAmbience(scene: Phaser.Scene) {
  addClouds(scene);
  addPondShimmer(scene);
  addSpillway(scene);
  addRiverRipples(scene);
  addFallingLeaves(scene);
}
