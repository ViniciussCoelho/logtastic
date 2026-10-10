import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from './damLayout';
import { DamScene, type DamSceneOptions } from './scenes/DamScene';

/** The only things React may ask of the running game. */
export interface DamGameHandle {
  setNamesVisible(visible: boolean): void;
  destroy(): void;
}

export function createDamGame(parent: HTMLElement, options: DamSceneOptions): DamGameHandle {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    backgroundColor: '#4fb4ea',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.ENVELOP, autoCenter: Phaser.Scale.CENTER_BOTH },
  });
  game.scene.add(DamScene.KEY, DamScene, true, options);

  const scene = () => game.scene.getScene<DamScene>(DamScene.KEY) as DamScene | null;

  return {
    setNamesVisible: (visible) => {
      options.namesVisible = visible;
      scene()?.setNamesVisible(visible);
    },
    destroy: () => game.destroy(true),
  };
}
