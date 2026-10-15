import Phaser from 'phaser';
import { WORLD_HEIGHT } from './damLayout';
import { DamScene, type DamSceneOptions } from './scenes/DamScene';
import { viewWidthFor } from './viewport';

/** The only things React may ask of the running game. */
export interface DamGameHandle {
  setNamesVisible(visible: boolean): void;
  destroy(): void;
}

export function createDamGame(parent: HTMLElement, options: DamSceneOptions): DamGameHandle {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: viewWidthFor(parent.clientWidth, parent.clientHeight),
    height: WORLD_HEIGHT,
    backgroundColor: '#4fb4ea',
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.ENVELOP, autoCenter: Phaser.Scale.CENTER_BOTH },
  });
  game.scene.add(DamScene.KEY, DamScene, true, options);

  // Rotating a phone or resizing the window can switch between the cropped and following views.
  const resize = new ResizeObserver(() => {
    const width = viewWidthFor(parent.clientWidth, parent.clientHeight);
    if (game.scale.gameSize.width !== width) game.scale.setGameSize(width, WORLD_HEIGHT);
  });
  resize.observe(parent);

  const scene = () => game.scene.getScene<DamScene>(DamScene.KEY) as DamScene | null;

  return {
    setNamesVisible: (visible) => {
      options.namesVisible = visible;
      scene()?.setNamesVisible(visible);
    },
    destroy: () => {
      resize.disconnect();
      game.destroy(true);
    },
  };
}
