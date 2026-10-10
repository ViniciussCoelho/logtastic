import { el, group, svgDocument } from '../../features/character/avatar/svg';

/**
 * Standalone props beavers can walk in front of or behind. Each texture's anchor
 * (its base on the deck) is exported so the scene can place and depth-sort it.
 */

const INK = '#2a1d17';
/** Same hand-drawn wobble as the room painting, a little gentler at prop size. */
const HAND_DRAWN = `<defs><filter id="hand-drawn" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="9" result="noise"/>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G"/>
</filter></defs>`;
const inked = (children: string[]) =>
  HAND_DRAWN +
  group(
    { stroke: INK, 'stroke-width': 4.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', filter: 'url(#hand-drawn)' },
    children,
  );

export interface PropArt {
  svg: string;
  /** Anchor in texture pixels, 0..1: where the prop touches the deck. */
  origin: { x: number; y: number };
}

export function lantern(): PropArt {
  const svg = inked([
    el('ellipse', { cx: 45, cy: 194, rx: 22, ry: 6, fill: 'rgba(31,20,14,0.2)', stroke: 'none' }),
    el('rect', { x: 38, y: 58, width: 14, height: 136, rx: 5, fill: '#9a6236' }),
    el('path', { d: 'M42 90 v40 M47 140 v30', stroke: '#c98d55', 'stroke-width': 2.5 }),
    el('rect', { x: 32, y: 182, width: 26, height: 12, rx: 4, fill: '#7c4f2e' }),
    // Lantern: cap, glass, bottom plate and a little hook ring.
    el('circle', { cx: 45, cy: 9, r: 5, fill: 'none' }),
    el('path', { d: 'M28 26 L45 12 L62 26 Z', fill: '#3a4a52' }),
    el('rect', { x: 30, y: 26, width: 30, height: 30, rx: 6, fill: '#ffd36e' }),
    el('rect', { x: 36, y: 31, width: 7, height: 18, rx: 3, fill: '#fff4c4', stroke: 'none' }),
    el('path', { d: 'M45 26 v30', stroke: '#3a4a52', 'stroke-width': 3 }),
    el('rect', { x: 27, y: 55, width: 36, height: 7, rx: 3, fill: '#3a4a52' }),
  ]);
  return { svg: svgDocument(svg, '0 0 90 200'), origin: { x: 0.5, y: 0.97 } };
}

export function stumpTable(): PropArt {
  const svg = inked([
    el('ellipse', { cx: 100, cy: 140, rx: 84, ry: 14, fill: 'rgba(31,20,14,0.2)', stroke: 'none' }),
    el('path', { d: 'M30 62 V124 Q30 146 100 146 Q170 146 170 124 V62 Z', fill: '#a8703f' }),
    el('path', { d: 'M52 80 V132 M84 86 V142 M120 86 V142 M150 80 V132', stroke: '#83532c', 'stroke-width': 3 }),
    el('path', { d: 'M30 124 Q16 132 10 144 M170 124 Q186 132 192 142', fill: 'none', stroke: '#83532c', 'stroke-width': 7 }),
    el('ellipse', { cx: 100, cy: 62, rx: 70, ry: 22, fill: '#f5d6a8' }),
    group({ fill: 'none', stroke: '#d9a96e', 'stroke-width': 2.5 }, [
      el('ellipse', { cx: 100, cy: 62, rx: 52, ry: 16 }),
      el('ellipse', { cx: 100, cy: 62, rx: 32, ry: 10 }),
      el('ellipse', { cx: 100, cy: 62, rx: 12, ry: 4 }),
    ]),
    // Acorn-cap cups and a leaf plate with berries.
    el('path', { d: 'M56 50 q0 14 14 14 q14 0 14 -14 Z', fill: '#c98d55' }),
    el('ellipse', { cx: 70, cy: 50, rx: 14, ry: 5, fill: '#7a4a28' }),
    el('path', { d: 'M126 52 q0 12 12 12 q12 0 12 -12 Z', fill: '#c98d55' }),
    el('ellipse', { cx: 138, cy: 52, rx: 12, ry: 4.5, fill: '#7a4a28' }),
    el('path', { d: 'M88 70 q18 -22 40 -4 q-18 18 -40 4 Z', fill: '#64c25a' }),
    el('circle', { cx: 104, cy: 66, r: 5, fill: '#e04a5f' }),
    el('circle', { cx: 113, cy: 68, r: 5, fill: '#e04a5f' }),
  ]);
  return { svg: svgDocument(svg, '0 0 200 160'), origin: { x: 0.5, y: 0.86 } };
}

export function logBench(): PropArt {
  const svg = inked([
    el('ellipse', { cx: 120, cy: 100, rx: 110, ry: 10, fill: 'rgba(31,20,14,0.2)', stroke: 'none' }),
    el('rect', { x: 46, y: 70, width: 18, height: 28, rx: 5, fill: '#83532c' }),
    el('rect', { x: 176, y: 70, width: 18, height: 28, rx: 5, fill: '#83532c' }),
    el('rect', { x: 14, y: 28, width: 214, height: 50, rx: 25, fill: '#b07440' }),
    el('path', { d: 'M50 44 h70 M140 60 h60 M70 64 h40', stroke: '#8a5a33', 'stroke-width': 3 }),
    el('path', { d: 'M110 30 q20 -12 46 -2', fill: 'none', stroke: '#64c25a', 'stroke-width': 8 }),
    el('ellipse', { cx: 22, cy: 53, rx: 15, ry: 25, fill: '#f5d6a8' }),
    el('ellipse', { cx: 22, cy: 53, rx: 8, ry: 14, fill: 'none', stroke: '#d9a96e', 'stroke-width': 2.5 }),
  ]);
  return { svg: svgDocument(svg, '0 0 240 112'), origin: { x: 0.5, y: 0.82 } };
}

/** The welcome sign; its lettering is drawn by the scene so it can use the game font. */
export function signpost(): PropArt {
  const svg = inked([
    el('ellipse', { cx: 160, cy: 214, rx: 96, ry: 9, fill: 'rgba(31,20,14,0.2)', stroke: 'none' }),
    el('rect', { x: 78, y: 70, width: 18, height: 144, rx: 5, fill: '#9a6236' }),
    el('rect', { x: 224, y: 70, width: 18, height: 144, rx: 5, fill: '#9a6236' }),
    el('path', { d: 'M28 40 Q160 22 292 40 L286 136 Q160 150 34 136 Z', fill: '#e2a466' }),
    el('path', { d: 'M40 72 Q160 60 282 72 M38 104 Q160 94 284 104', fill: 'none', stroke: '#c48448', 'stroke-width': 3 }),
    ...[[46, 52], [274, 52], [48, 124], [272, 124]].map(([cx, cy]) =>
      el('circle', { cx: cx ?? 0, cy: cy ?? 0, r: 4, fill: '#6b5a50', 'stroke-width': 2 }),
    ),
    el('path', { d: 'M282 44 q24 -4 28 22 q-20 2 -28 -22 Z', fill: '#64c25a' }),
    el('path', { d: 'M30 132 q-18 6 -18 26 q18 -4 18 -26 Z', fill: '#64c25a' }),
  ]);
  return { svg: svgDocument(svg, '0 0 320 226'), origin: { x: 0.5, y: 0.95 } };
}

/** Center of the sign board relative to the sign's anchor, for the lettering. */
export const SIGN_TEXT_OFFSET = { x: 0, y: -129 } as const;
