import Phaser from 'phaser';
import type { AvatarAppearance } from '../../features/character/appearance';
import type { Direction, WalkStep } from '../../features/character/avatar/pose';
import type { RoomPlayer } from '../../services/protocol';
import type { Vec2 } from '../../types/geometry';
import type { EmoteId } from '../../features/chat/emotes';
import { AVATAR_TEXTURE_SCALE, bodyTextureKey, emoteTextureKey, hatTextureKey } from '../avatarTextures';
import type { RoomLayout } from '../damLayout';
import { facingFor, stepTowards } from '../movement';
import { BubbleQueue } from './bubbleQueue';
import { EmoteBubble } from './EmoteBubble';
import { SpeechBubble } from './SpeechBubble';

const DISPLAY_SCALE = 1.2;
/** Where the shoes touch the deck on the 150px avatar canvas. */
const FEET_ORIGIN_Y = 141 / 150;
const SPEED = 250;
const STEP_MS = 115;
const WALK_CYCLE: readonly WalkStep[] = [1, 0, 2, 0];
const BLINK_MS = 140;
/** A balloon stays readable at least this long before a follow-up replaces it. */
const MIN_BUBBLE_MS = 1600;
const MAX_WAITING_BUBBLES = 3;

/** What a beaver's balloon currently shows. */
export type BubbleContent = { kind: 'text'; text: string } | { kind: 'emote'; emoteId: EmoteId };

interface PendingBubble {
  content: BubbleContent;
  create: (onGone: () => void) => Phaser.GameObjects.Container;
}

/** A beaver in the room: avatar layers, name tag and speech bubble moving as one. */
export class Beaver extends Phaser.GameObjects.Container {
  readonly playerId: string;
  private readonly appearance: AvatarAppearance;
  private readonly bodySprite: Phaser.GameObjects.Image;
  private readonly hatSprite: Phaser.GameObjects.Image | null;
  private readonly nameTag: Phaser.GameObjects.Container;
  private readonly bubbleY: number;
  /** One balloon at a time; follow-ups wait their turn in the queue. */
  private bubble: Phaser.GameObjects.Container | null = null;
  private bubbleShown: BubbleContent | null = null;
  private readonly bubbles = new BubbleQueue<PendingBubble>(MIN_BUBBLE_MS, MAX_WAITING_BUBBLES);
  private bubbleTimer: Phaser.Time.TimerEvent | null = null;

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

    this.add([
      ...(isLocal ? [createSelfMarker(scene)] : []),
      this.bodySprite,
      ...(this.hatSprite ? [this.hatSprite] : []),
      this.nameTag,
    ]);
    this.startIdleBounce(scale);
    this.setDepth(this.y);
    scene.add.existing(this);
  }

  walkTo(target: Vec2): void {
    this.target = target;
  }

  say(text: string): void {
    this.showBubble({ kind: 'text', text }, (onGone) => new SpeechBubble(this.scene, this.bubbleY, text, onGone));
  }

  emote(emoteId: EmoteId): void {
    const key = emoteTextureKey(this.appearance.fur, emoteId);
    this.showBubble({ kind: 'emote', emoteId }, (onGone) => new EmoteBubble(this.scene, this.bubbleY, key, onGone));
  }

  get bubbleContent(): BubbleContent | null {
    return this.bubbleShown;
  }

  private showBubble(content: BubbleContent, create: PendingBubble['create']): void {
    const now = this.scene.time.now;
    const ready = this.bubbles.offer({ content, create }, now);
    if (ready) this.displayBubble(ready);
    else this.scheduleNextBubble(now);
  }

  private scheduleNextBubble(now: number): void {
    const wait = this.bubbles.nextIn(now);
    if (this.bubbleTimer || wait === null) return;
    this.bubbleTimer = this.scene.time.delayedCall(wait, () => {
      this.bubbleTimer = null;
      const next = this.bubbles.take(this.scene.time.now);
      if (next) this.displayBubble(next);
      this.scheduleNextBubble(this.scene.time.now);
    });
  }

  private displayBubble({ content, create }: PendingBubble): void {
    this.bubble?.destroy();
    const bubble = create(() => {
      if (this.bubble !== bubble) return;
      this.bubble = null;
      this.bubbleShown = null;
    });
    this.bubble = bubble;
    this.bubbleShown = content;
    this.add(bubble);
  }

  override destroy(fromScene?: boolean): void {
    this.bubbleTimer?.remove();
    this.bubbleTimer = null;
    super.destroy(fromScene);
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

/** A soft glowing ring under the local player's feet, so they can spot themselves in a crowd. */
function createSelfMarker(scene: Phaser.Scene): Phaser.GameObjects.Ellipse {
  const ring = scene.add.ellipse(0, 1, 104, 34, 0xffd56b, 0.28).setStrokeStyle(4, 0xf6b544, 0.95);
  scene.tweens.add({ targets: ring, scale: 1.08, alpha: 0.7, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  return ring;
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
