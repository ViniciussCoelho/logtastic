import type { FurPalette } from '../character/appearance';
import { el, group, svgDocument } from '../character/avatar/svg';
import type { EmoteId } from './emotes';

/**
 * Beaver emotes: popular emojis redrawn as a beaver head in the sender's fur, painted like
 * the room (ink outlines, cel shade on the right, hand-drawn wobble).
 */
const INK = '#2a1d17';
const SHADE = 'rgba(70, 36, 14, 0.24)';
const LIT = 'rgba(255, 246, 228, 0.65)';
const NOSE = '#2b1a12';
const TEETH = '#fff6dc';
const MOUTH = '#8a2f2a';
const RED = '#e2453c';
const TEAR = '#6cc7f2';
const NO_STROKE = { stroke: 'none' };

export const EMOTE_SIZE = 64;

const HAND_DRAWN =
  '<defs><filter id="emote-hand-drawn" x="-10%" y="-10%" width="120%" height="120%">' +
  '<feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="4" result="noise"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G"/>' +
  '</filter></defs>';

const dotEyes = el('ellipse', { cx: 25, cy: 31, rx: 2.4, ry: 3.2, fill: INK, ...NO_STROKE }) + el('ellipse', { cx: 39, cy: 31, rx: 2.4, ry: 3.2, fill: INK, ...NO_STROKE });
const happyEyes = el('path', { d: 'M21 32 Q25 27 29 32 M35 32 Q39 27 43 32', fill: 'none', 'stroke-width': 2.4 });
const closedEyes = el('path', { d: 'M21 31 Q25 34 29 31 M35 31 Q39 34 43 31', fill: 'none', 'stroke-width': 2.4 });
const smile = el('path', { d: 'M26 44 Q32 49 38 44', fill: 'none', 'stroke-width': 2.2 });
const openSmile = el('path', { d: 'M23 42 Q32 55 41 42 Z', fill: MOUTH, 'stroke-width': 2.2 });
const frown = el('path', { d: 'M26 49 Q32 44 38 49', fill: 'none', 'stroke-width': 2.2 });
const teeth = (y = 42) =>
  el('rect', { x: 28.6, y, width: 3.4, height: 5, rx: 0.8, fill: TEETH, 'stroke-width': 1.3 }) +
  el('rect', { x: 32, y, width: 3.4, height: 5, rx: 0.8, fill: TEETH, 'stroke-width': 1.3 });
const heart = (cx: number, cy: number, size: number, fill = RED) =>
  el('path', {
    d: `M${cx} ${cy + size * 0.9} C${cx - size * 1.5} ${cy - size * 0.1} ${cx - size * 0.7} ${cy - size * 1.2} ${cx} ${cy - size * 0.4} C${cx + size * 0.7} ${cy - size * 1.2} ${cx + size * 1.5} ${cy - size * 0.1} ${cx} ${cy + size * 0.9} Z`,
    fill,
    'stroke-width': 1.8,
  });
const paw = (cx: number, cy: number, palette: FurPalette) => el('ellipse', { cx, cy, rx: 6.5, ry: 5.5, fill: palette.base, 'stroke-width': 2 });

/** The shared beaver head every emote is drawn on. */
function head(palette: FurPalette, face: string): string {
  return [
    el('circle', { cx: 14, cy: 16, r: 5, fill: palette.base, 'stroke-width': 2 }),
    el('circle', { cx: 50, cy: 16, r: 5, fill: palette.base, 'stroke-width': 2 }),
    el('path', { d: 'M32 10 C49 10 56 22 56 35 C56 50 46 58 32 58 C18 58 8 50 8 35 C8 22 15 10 32 10 Z', fill: palette.base, 'stroke-width': 2.8 }),
    el('path', { d: 'M50 24 C55 32 55 46 46 54 C42 57 37 58 33 58 C44 52 50 40 48 28 Z', fill: SHADE, ...NO_STROKE }),
    el('ellipse', { cx: 32, cy: 43, rx: 13, ry: 10, fill: palette.light, ...NO_STROKE }),
    el('path', { d: 'M15 30 Q16 19 26 14', fill: 'none', stroke: LIT, 'stroke-width': 2.4 }),
    el('path', { d: 'M28 38 Q32 36 36 38 Q34 41 32 41 Q30 41 28 38 Z', fill: NOSE, 'stroke-width': 1.4 }),
    el('ellipse', { cx: 19, cy: 40, rx: 3.6, ry: 2, fill: '#ff8f86', opacity: 0.5, ...NO_STROKE }),
    el('ellipse', { cx: 45, cy: 40, rx: 3.6, ry: 2, fill: '#ff8f86', opacity: 0.5, ...NO_STROKE }),
    face,
  ].join('');
}

function expression(id: EmoteId, palette: FurPalette): string {
  switch (id) {
    case 'laugh':
      return happyEyes + openSmile + teeth() +
        el('path', { d: 'M16 33 q-4 6 -2 11 q3 2 4 -2 Z M48 33 q4 6 2 11 q-3 2 -4 -2 Z', fill: TEAR, 'stroke-width': 1.6 });
    case 'love':
      return heart(25, 30, 4.4) + heart(39, 30, 4.4) + smile + teeth(44);
    case 'thumbs-up':
      return dotEyes + smile + teeth(44) +
        el('rect', { x: 47, y: 34, width: 6, height: 12, rx: 3, fill: palette.base, 'stroke-width': 2 }) +
        el('rect', { x: 42, y: 44, width: 15, height: 12, rx: 5, fill: palette.base, 'stroke-width': 2 });
    case 'wow':
      return el('path', { d: 'M20 24 q5 -4 10 -1 M34 23 q5 -3 10 1', fill: 'none', 'stroke-width': 2 }) +
        el('circle', { cx: 25, cy: 31, r: 3.4, fill: INK, ...NO_STROKE }) + el('circle', { cx: 39, cy: 31, r: 3.4, fill: INK, ...NO_STROKE }) +
        el('ellipse', { cx: 32, cy: 48, rx: 4, ry: 5, fill: MOUTH, 'stroke-width': 2 }) + teeth(43);
    case 'sad':
      return el('path', { d: 'M20 26 l9 3 M44 26 l-9 3', fill: 'none', 'stroke-width': 2 }) + dotEyes + frown + teeth(42) +
        el('path', { d: 'M24 36 q-3 5 0 8 q3 -3 0 -8 Z', fill: TEAR, 'stroke-width': 1.5 });
    case 'angry':
      return el('path', { d: 'M8 35 C8 22 15 10 32 10 C49 10 56 22 56 35 C48 30 16 30 8 35 Z', fill: RED, opacity: 0.35, ...NO_STROKE }) +
        el('path', { d: 'M19 26 l10 4 M45 26 l-10 4', fill: 'none', 'stroke-width': 2.6 }) + dotEyes + frown + teeth(42) +
        el('path', { d: 'M4 14 q3 -4 6 0 M54 14 q3 -4 6 0', fill: 'none', stroke: '#c9d3dc', 'stroke-width': 2.4 });
    case 'cool':
      return el('path', { d: 'M15 27 H49 V31 Q48 37 41 37 Q35 37 34 31 H30 Q29 37 23 37 Q16 37 15 31 Z', fill: INK, 'stroke-width': 1.6 }) +
        el('path', { d: 'M19 29 l4 4 M37 29 l4 4', stroke: '#8fd0f2', 'stroke-width': 1.6 }) +
        el('path', { d: 'M26 45 Q33 48 39 43', fill: 'none', 'stroke-width': 2.2 }) + teeth(43);
    case 'party':
      return el('path', { d: 'M24 13 L33 -2 L40 14 Z', fill: '#6c5ce7', 'stroke-width': 2 }) +
        el('path', { d: 'M28 7 L37 9 M26 11 L39 13', stroke: '#ffd23f', 'stroke-width': 2 }) +
        el('circle', { cx: 33, cy: -2, r: 2.6, fill: '#ffd23f', 'stroke-width': 1.4 }) +
        happyEyes + openSmile + teeth() +
        el('rect', { x: 4, y: 20, width: 3, height: 5, fill: '#ff6fa8', transform: 'rotate(20 5 22)', ...NO_STROKE }) +
        el('rect', { x: 56, y: 26, width: 3, height: 5, fill: '#4fc3f7', transform: 'rotate(-25 57 28)', ...NO_STROKE }) +
        el('circle', { cx: 9, cy: 50, r: 1.8, fill: '#ffd23f', ...NO_STROKE });
    case 'sleepy':
      return closedEyes + el('ellipse', { cx: 32, cy: 48, rx: 2.6, ry: 2, fill: MOUTH, 'stroke-width': 1.6 }) + teeth(42) +
        el('path', { d: 'M46 6 h7 l-7 8 h7 M55 0 h4 l-4 5 h4', fill: 'none', stroke: '#4f8fd6', 'stroke-width': 2 });
    case 'think':
      return el('path', { d: 'M20 25 q5 -4 9 -1 M35 26 l9 -1', fill: 'none', 'stroke-width': 2 }) +
        el('ellipse', { cx: 26.5, cy: 30, rx: 2.4, ry: 3.2, fill: INK, ...NO_STROKE }) + el('ellipse', { cx: 40.5, cy: 30, rx: 2.4, ry: 3.2, fill: INK, ...NO_STROKE }) +
        el('path', { d: 'M27 47 h9', fill: 'none', 'stroke-width': 2.2 }) + teeth(42) + paw(40, 54, palette);
    case 'wave':
      return happyEyes + openSmile + teeth() + paw(54, 22, palette) +
        el('path', { d: 'M58 10 q4 3 3 8 M61 6 q6 5 5 12', fill: 'none', 'stroke-width': 1.8 });
    case 'heart':
      return '';
  }
}

/** A beaver heart: a big red heart with dot eyes and buck teeth. */
function beaverHeart(): string {
  return [
    heart(32, 32, 19),
    el('path', { d: 'M18 22 Q20 15 27 15', fill: 'none', stroke: LIT, 'stroke-width': 2.6 }),
    el('ellipse', { cx: 26, cy: 30, rx: 2.4, ry: 3.2, fill: INK, ...NO_STROKE }),
    el('ellipse', { cx: 38, cy: 30, rx: 2.4, ry: 3.2, fill: INK, ...NO_STROKE }),
    el('path', { d: 'M27 37 Q32 41 37 37', fill: 'none', 'stroke-width': 2 }),
    teeth(37.5),
  ].join('');
}

export function renderEmote(id: EmoteId, palette: FurPalette): string {
  const art = id === 'heart' ? beaverHeart() : head(palette, expression(id, palette));
  return svgDocument(
    HAND_DRAWN +
      group({ filter: 'url(#emote-hand-drawn)' }, [
        group({ stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, [art]),
      ]),
    `-2 -4 ${EMOTE_SIZE + 4} ${EMOTE_SIZE + 6}`,
  );
}
