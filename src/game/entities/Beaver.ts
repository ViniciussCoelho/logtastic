import Phaser from 'phaser';
import type { AvatarAppearance } from '../../features/character/appearance';
import type { Direction, WalkStep } from '../../features/character/avatar/pose';
import type { RoomPlayer } from '../../services/protocol';
import type { Vec2 } from '../../types/geometry';
import { AVATAR_TEXTURE_SCALE, bodyTextureKey, hatTextureKey } from '../avatarTextures';
import type { RoomLayout } from '../damLayout';
import { facingFor, stepTowards } from '../movement';
import { SpeechBubble } from './SpeechBubble';

const DISPLAY_SCALE = 1.2;
/** Where the shoes touch the deck on the 150px avatar canvas. */
const FEET_ORIGIN_Y = 141 / 150;
const SPEED = 250;
const STEP_MS = 115;
const WALK_CYCLE: readonly WalkStep[] = [1, 0, 2, 0];
const BLINK_MS = 140;

/** A beaver in the room: avatar layers, name tag and speech bubble moving as one. */
export class Beaver extends Phaser.GameObjects.Container {
  readonly playerId: string;
  private readonly appearance: AvatarAppearance;
  private readonly bodySprite: Phaser.GameObjects.Image;
  private readonly hatSprite: Phaser.GameObjects.Image | null;
  private readonly nameTag: Phaser.GameObjects.Container;
  private readonly bubbleY: number;
  private bubble: SpeechBubble | null = null;

  private direction: Direction = 'front';
  private target: Vec2 | null = null;
  private walkClock = 0;
  private blinkIn = Phaser.Math.Between(1500, 4500);
  private blinkLeft = 0;

  constructor(
    scene: Phaser.Scene,
    player: RoomPlayer,
    private readonly layout: RoomLayout,
    isLocal: boolean,
  ) {
    super(scene, player.position.x, player.position.y);
    this.playerId = player.id;
    this.appearance = player.appearance;

    const scale = DISPLAY_SCALE / AVATAR_TEXTURE_SCALE;
    this.bodySprite = scene.add.image(0, 0, this.bodyKey(0, false)).setOrigin(0.5, FEET_ORIGIN_Y).setScale(scale);
    this.hatSprite =
      player.appearance.hat === 'none'
        ? null
        : scene.add.image(0, 0, this.hatKey(0)).setOrigin(0.5, FEET_ORIGIN_Y).setScale(scale);

    const headTop = -(player.appearance.hat === 'none' ? 118 : 140) * DISPLAY_SCALE;
    this.nameTag = createNameTag(scene, player.nickname, isLocal, headTop - 6);
    this.bubbleY = headTop - 46;

    this.add([this.bodySprite, ...(this.hatSprite ? [this.hatSprite] : []), this.nameTag]);
    this.startIdleBounce(scale);
    this.setDepth(this.y);
    scene.add.existing(this);
  }

  walkTo(target: Vec2): void {
    this.target = target;
  }

  say(text: string): void {
    this.bubble?.destroy();
    const bubble = new SpeechBubble(this.scene, this.bubbleY, text, () => {
      if (this.bubble === bubble) this.bubble = null;
    });
    this.bubble = bubble;
    this.add(bubble);
  }

  setNameVisible(visible: boolean): void {
    this.nameTag.setVisible(visible);
  }

  update(deltaMs: number): void {
    const walking = this.advance(deltaMs);
    let step: WalkStep = 0;
    if (walking) {
      this.walkClock += deltaMs;
      step = WALK_CYCLE[Math.floor(this.walkClock / STEP_MS) % WALK_CYCLE.length] ?? 0;
    } else {
      this.walkClock = 0;
    }
    this.setFrame(step, !walking && this.tickBlink(deltaMs));
    this.setDepth(this.y);
  }

  /** Moves towards the target; returns whether the beaver is still walking. */
  private advance(deltaMs: number): boolean {
    if (!this.target) return false;
    const from = { x: this.x, y: this.y };
    const { position, arrived } = stepTowards(from, this.target, (SPEED * deltaMs) / 1000, this.layout);
    this.direction = facingFor(position.x - from.x, position.y - from.y, this.direction);
    this.setPosition(position.x, position.y);
    if (arrived) this.target = null;
    return !arrived;
  }

  private tickBlink(deltaMs: number): boolean {
    if (this.blinkLeft > 0) {
      this.blinkLeft -= deltaMs;
      return true;
    }
    this.blinkIn -= deltaMs;
    if (this.blinkIn <= 0) {
      this.blinkLeft = BLINK_MS;
      this.blinkIn = Phaser.Math.Between(2200, 5200);
    }
    return false;
  }

  private setFrame(step: WalkStep, blink: boolean): void {
    const bodyKey = this.bodyKey(step, blink);
    if (this.bodySprite.texture.key !== bodyKey) this.bodySprite.setTexture(bodyKey);
    if (this.hatSprite) {
      const hatKey = this.hatKey(step);
      if (this.hatSprite.texture.key !== hatKey) this.hatSprite.setTexture(hatKey);
    }
  }

  /** The old-cartoon "everything bounces" idle, offset per beaver so the room isn't in lockstep. */
  private startIdleBounce(scale: number): void {
    const sprites = this.hatSprite ? [this.bodySprite, this.hatSprite] : [this.bodySprite];
    this.scene.tweens.add({
      targets: sprites,
      scaleY: scale * 1.035,
      scaleX: scale * 0.975,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      delay: Phaser.Math.Between(0, 500),
    });
  }

  private bodyKey(step: WalkStep, blink: boolean): string {
    return bodyTextureKey(this.appearance.fur, this.appearance.face, this.direction, step, blink);
  }

  private hatKey(step: WalkStep): string {
    return hatTextureKey(this.appearance.hat, this.direction, step);
  }
}

function createNameTag(scene: Phaser.Scene, nickname: string, isLocal: boolean, y: number): Phaser.GameObjects.Container {
  const text = scene.add
    .text(0, 0, nickname, {
      fontFamily: 'Fredoka, Nunito, system-ui, sans-serif',
      fontStyle: '600',
      fontSize: '22px',
      color: '#2b1b13',
    })
    .setOrigin(0.5);
  const width = text.width + 22;
  const height = text.height + 6;
  const pill = scene.add.graphics();
  pill.fillStyle(isLocal ? 0xf6b544 : 0xffffff, isLocal ? 1 : 0.92).lineStyle(3, 0x2b1b13);
  pill.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
  pill.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);
  return scene.add.container(0, y - height / 2, [pill, text]);
}
