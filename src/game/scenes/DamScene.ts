import Phaser from 'phaser';
import { getChatMessageText } from '../../features/chat/messages';
import type { RoomConnection, RoomPlayer, ServerEvent } from '../../services/protocol';
import type { PlayerProfile } from '../../types/player';
import type { Vec2 } from '../../types/geometry';
import { renderDamBackdrop } from '../art/damBackdrop';
import { lantern, logBench, signpost, SIGN_TEXT_OFFSET, stumpTable, type PropArt } from '../art/props';
import { AvatarTextures } from '../avatarTextures';
import { DAM_LAYOUT, DAM_PROPS, WORLD_HEIGHT, WORLD_WIDTH } from '../damLayout';
import { Beaver } from '../entities/Beaver';
import { clampToWalkable, isWalkable } from '../movement';
import { addSvgTexture } from '../svgTexture';
import { addAmbience, addLanternGlow } from './ambience';
import { installDamDebug } from './damDebug';

export interface DamSceneOptions {
  connection: RoomConnection;
  player: PlayerProfile;
  namesVisible: boolean;
  /** Called once the room is drawn and everyone from the welcome is standing on the deck. */
  onReady: () => void;
}

const PROP_TEXTURE_SCALE = 1.5;

/** Lantern glass sits this far above the post's base. */
const LANTERN_GLASS_OFFSET = -153;

/**
 * The Dam. Renders whatever the room connection reports and sends the local player's
 * intents back; it never decides where *other* beavers go.
 */
export class DamScene extends Phaser.Scene {
  static readonly KEY = 'dam';

  private options!: DamSceneOptions;
  private avatars!: AvatarTextures;
  private readonly beavers = new Map<string, Beaver>();
  private selfId: string | null = null;
  private namesVisible = true;
  private alive = false;
  /** Room events are applied strictly in order, even when spawning waits on textures. */
  private eventQueue: Promise<void> = Promise.resolve();
  private unsubscribe: () => void = () => {};
  private uninstallDebug: () => void = () => {};

  constructor() {
    super(DamScene.KEY);
  }

  init(options: DamSceneOptions): void {
    this.options = options;
    this.namesVisible = options.namesVisible;
  }

  create(): void {
    this.alive = true;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.tearDown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.tearDown, this);
    if (import.meta.env.DEV) {
      this.uninstallDebug = installDamDebug({ selfId: () => this.selfId, beaver: (id) => this.beavers.get(id) });
    }
    void this.setUp();
  }

  update(_time: number, delta: number): void {
    this.beavers.forEach((beaver) => beaver.update(delta));
  }

  setNamesVisible(visible: boolean): void {
    this.namesVisible = visible;
    this.beavers.forEach((beaver) => beaver.setNameVisible(visible));
  }

  private async setUp(): Promise<void> {
    await document.fonts?.ready;
    await this.buildWorld();
    if (!this.alive) return;

    this.avatars = new AvatarTextures(this);
    this.unsubscribe = this.options.connection.subscribe((event) => this.enqueue(event));
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleClick, this);

    const { nickname, appearance } = this.options.player;
    this.options.connection.send({ type: 'join', nickname, appearance });
  }

  private async buildWorld(): Promise<void> {
    const props: Record<string, PropArt> = {
      lantern: lantern(),
      'stump-table': stumpTable(),
      'log-bench': logBench(),
      signpost: signpost(),
    };
    await Promise.all([
      addSvgTexture(this, 'dam-backdrop', renderDamBackdrop()),
      ...Object.entries(props).map(([key, art]) => addSvgTexture(this, key, art.svg, PROP_TEXTURE_SCALE)),
    ]);
    if (!this.alive) return;

    this.add.image(0, 0, 'dam-backdrop').setOrigin(0).setDepth(-10);
    // When the view is narrower than the room (portrait phones), the camera follows the player.
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    addAmbience(this);

    const place = (key: string, at: Vec2) => {
      const art = props[key]!;
      return this.add
        .image(at.x, at.y, key)
        .setOrigin(art.origin.x, art.origin.y)
        .setScale(1 / PROP_TEXTURE_SCALE)
        .setDepth(at.y);
    };

    place('signpost', DAM_PROPS.sign);
    this.add
      .text(DAM_PROPS.sign.x + SIGN_TEXT_OFFSET.x, DAM_PROPS.sign.y + SIGN_TEXT_OFFSET.y, 'The Dam', {
        fontFamily: 'Fredoka, Nunito, system-ui, sans-serif',
        fontStyle: '700',
        fontSize: '52px',
        color: '#5a3216',
      })
      .setOrigin(0.5)
      .setDepth(DAM_PROPS.sign.y + 0.1);

    [...DAM_PROPS.backLanterns, ...DAM_PROPS.frontLanterns].forEach((spot) => {
      place('lantern', spot);
      addLanternGlow(this, spot.x, spot.y + LANTERN_GLASS_OFFSET, spot.y + 0.1);
    });
    place('stump-table', DAM_PROPS.stumpTable);
    place('log-bench', DAM_PROPS.logBench);
  }

  private enqueue(event: ServerEvent): void {
    this.eventQueue = this.eventQueue
      .then(() => (this.alive ? this.handle(event) : undefined))
      .catch((error: unknown) => console.error('[dam] failed to apply room event', event, error));
  }

  private async handle(event: ServerEvent): Promise<void> {
    switch (event.type) {
      case 'welcome': {
        this.selfId = event.selfId;
        await Promise.all(event.players.map((player) => this.avatars.ensure(player.appearance)));
        if (!this.alive) return;
        // The server starts new players at (0, 0), off the deck. Start at the spawn instead,
        // and say so once, so everyone else sees us in the same place.
        const self = event.players.find((player) => player.id === event.selfId);
        const offDeck = self !== undefined && !isWalkable(self.position, DAM_LAYOUT);
        event.players.forEach((player) =>
          this.spawn(offDeck && player === self ? { ...player, position: DAM_LAYOUT.spawn } : player),
        );
        if (offDeck) this.options.connection.send({ type: 'move', target: DAM_LAYOUT.spawn });
        this.options.onReady();
        return;
      }
      case 'player_joined':
        await this.avatars.ensure(event.player.appearance);
        if (this.alive) this.spawn(event.player, true);
        return;
      case 'player_left':
        this.despawn(event.playerId);
        return;
      case 'player_moved':
        // Our own moves are applied locally the moment we click.
        if (event.playerId !== this.selfId) {
          this.beavers.get(event.playerId)?.walkTo(clampToWalkable(event.target, DAM_LAYOUT));
        }
        return;
      case 'chat':
        this.beavers.get(event.playerId)?.say(getChatMessageText(event.messageId));
        return;
      case 'say':
        this.beavers.get(event.playerId)?.say(event.text);
        return;
      case 'emote':
        this.beavers.get(event.playerId)?.emote(event.emoteId);
        return;
    }
  }

  private spawn(player: RoomPlayer, announce = false): void {
    if (this.beavers.has(player.id)) return;
    const position = clampToWalkable(player.position, DAM_LAYOUT);
    const beaver = new Beaver(this, { ...player, position }, DAM_LAYOUT, player.id === this.selfId);
    beaver.setNameVisible(this.namesVisible);
    this.beavers.set(player.id, beaver);
    if (player.id === this.selfId) this.cameras.main.startFollow(beaver, true, 0.08, 0);
    if (announce) {
      beaver.setScale(0.2);
      this.tweens.add({ targets: beaver, scale: 1, duration: 380, ease: 'Back.Out' });
    }
  }

  private despawn(playerId: string): void {
    const beaver = this.beavers.get(playerId);
    if (!beaver) return;
    this.beavers.delete(playerId);
    this.tweens.add({
      targets: beaver,
      scale: 0.2,
      alpha: 0,
      duration: 320,
      ease: 'Back.In',
      onComplete: () => beaver.destroy(),
    });
  }

  private handleClick(pointer: Phaser.Input.Pointer): void {
    const local = this.selfId ? this.beavers.get(this.selfId) : undefined;
    if (!local) return;
    const target = clampToWalkable({ x: pointer.worldX, y: pointer.worldY }, DAM_LAYOUT);
    local.walkTo(target);
    this.options.connection.send({ type: 'move', target });
    this.showClickMarker(target);
  }

  private showClickMarker(at: Vec2): void {
    const marker = this.add.ellipse(at.x, at.y, 44, 18).setStrokeStyle(4, 0xffffff, 0.95).setDepth(at.y - 1);
    this.tweens.add({ targets: marker, scale: 1.6, alpha: 0, duration: 520, onComplete: () => marker.destroy() });
  }

  private tearDown(): void {
    if (!this.alive) return;
    this.alive = false;
    this.uninstallDebug();
    this.unsubscribe();
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleClick, this);
    this.beavers.clear();
  }
}
