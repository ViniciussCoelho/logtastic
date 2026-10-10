import type { FaceId, FurPalette } from '../appearance';
import { el } from './svg';

/**
 * The swappable part of the face: eyes and brows. Nose, mouth and teeth stay the same
 * for every beaver so they remain recognizable.
 */
const INK = '#2a1d17';
const NO_STROKE = { stroke: 'none' };

/** An eye position on the head. `side` is -1 for the viewer's left eye, 1 for the right. */
export interface EyeSpot {
  x: number;
  y: number;
  side: -1 | 1;
}

const closedArc = (x: number, y: number): string =>
  el('path', { d: `M${x - 4.5} ${y} Q${x} ${y + 3} ${x + 4.5} ${y}`, fill: 'none', 'stroke-width': 2.6 });

const happyArc = (x: number, y: number): string =>
  el('path', { d: `M${x - 5} ${y + 2} Q${x} ${y - 5} ${x + 5} ${y + 2}`, fill: 'none', 'stroke-width': 3 });

const dot = (x: number, y: number): string => el('ellipse', { cx: x, cy: y, rx: 3.6, ry: 4.8, fill: INK, ...NO_STROKE });

/** Soft brow arching from the outer corner to the inner one. */
const softBrow = ({ x, y, side }: EyeSpot): string =>
  el('path', { d: `M${x + side * 7} ${y - 11} Q${x} ${y - 14} ${x - side * 6} ${y - 11}`, fill: 'none', 'stroke-width': 3 });

/** Brow slanting down towards the nose: confident, a little smug. */
const slantedBrow = ({ x, y, side }: EyeSpot): string =>
  el('path', { d: `M${x + side * 7} ${y - 13} L${x - side * 6} ${y - 9}`, fill: 'none', 'stroke-width': 3.2 });

function sparkleEye(x: number, y: number): string {
  return [
    el('circle', { cx: x, cy: y, r: 5.6, fill: INK, ...NO_STROKE }),
    el('circle', { cx: x - 1.8, cy: y - 2, r: 2, fill: '#fff', ...NO_STROKE }),
    el('circle', { cx: x + 2, cy: y + 2.2, r: 1, fill: '#fff', ...NO_STROKE }),
  ].join('');
}

/** A dot with the top half hidden under a flat lid. */
function coolEye(x: number, y: number, palette: FurPalette): string {
  return [
    dot(x, y),
    el('rect', { x: x - 5, y: y - 6, width: 10, height: 5.5, fill: palette.base, ...NO_STROKE }),
    el('path', { d: `M${x - 5} ${y - 0.5} L${x + 5} ${y - 0.5}`, 'stroke-width': 2.6 }),
  ].join('');
}

export function renderEyes(face: FaceId, eyes: readonly EyeSpot[], blink: boolean, palette: FurPalette): string {
  return eyes
    .map((spot, index) => {
      const { x, y } = spot;
      switch (face) {
        case 'dots':
          return softBrow(spot) + (blink ? closedArc(x, y) : dot(x, y));
        case 'sparkle':
          return blink ? closedArc(x, y) : sparkleEye(x, y);
        case 'happy':
          return softBrow({ ...spot, y: spot.y - 1 }) + happyArc(x, y);
        case 'cool':
          return slantedBrow(spot) + (blink ? closedArc(x, y) : coolEye(x, y, palette));
        case 'wink': {
          // The second eye of a front view is the one that winks.
          const winking = index === 1;
          return softBrow(spot) + (blink || winking ? (winking ? happyArc(x, y) : closedArc(x, y)) : dot(x, y));
        }
      }
    })
    .join('');
}
