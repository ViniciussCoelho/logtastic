import type { Vec2 } from '../../types/geometry';
import type { Beaver, BubbleContent } from '../entities/Beaver';

/** Read-only window into the canvas for browser tests. Installed only in dev builds. */
export interface DamDebug {
  selfId(): string | null;
  position(playerId: string): Vec2 | null;
  bubble(playerId: string): BubbleContent | null;
}

declare global {
  interface Window {
    __damDebug?: DamDebug;
  }
}

interface DebugSource {
  selfId(): string | null;
  beaver(playerId: string): Beaver | undefined;
}

/** Installs the hook and returns a function that removes it (only if it is still ours). */
export function installDamDebug(source: DebugSource): () => void {
  const debug: DamDebug = {
    selfId: source.selfId,
    position: (id) => {
      const beaver = source.beaver(id);
      return beaver ? { x: beaver.x, y: beaver.y } : null;
    },
    bubble: (id) => source.beaver(id)?.bubbleContent ?? null,
  };
  window.__damDebug = debug;
  return () => {
    // A newer session may have installed its own hook already.
    if (window.__damDebug === debug) delete window.__damDebug;
  };
}
