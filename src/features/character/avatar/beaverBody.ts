import type { FaceId, FurPalette } from '../appearance';
import { renderEyes } from './faces';
import { strideBob, type AvatarPose, type WalkStep } from './pose';
import { el, group, handDrawn, orient, svgDocument } from './svg';

/**
 * A chubby, bean-shaped beaver: head and body are one gumdrop silhouette, with a cream
 * patch running from muzzle to belly, pointy cheek tufts, a choice of faces, stubby
 * nub arms and feet. Beaver tells: buck teeth and a paddle tail.
 *
 * Painted like the room: light comes from the upper left, so every part gets a lit side
 * (highlight strokes) and a shadow side (cel shade), the silhouette is inked heavier than
 * the details, and the whole layer gets the shared hand-drawn wobble.
 * Fur recolors everything except ink, nose, teeth and tail. Eyes come from faces.ts.
 */
const TAIL = '#6b4a3a';
const TAIL_SCALES = '#4a3128';
const NOSE = '#2b1a12';
const TEETH = '#fff6dc';
const BLUSH = '#ff8f86';
const SHADOW = 'rgba(42, 26, 18, 0.2)';
/** Cel shade laid over any fur color on the side facing away from the light. */
const SHADE = 'rgba(70, 36, 14, 0.24)';
/** Highlight stroke on the side facing the light. */
const LIT = 'rgba(255, 246, 228, 0.6)';
const NO_STROKE = { stroke: 'none' };
const SILHOUETTE = 3.4;
const PART = 2.8;

/** Gumdrop silhouette for front and back: narrower head, plump bottom. */
const BEAN = 'M60 22 C84 22 94 40 94 62 C94 78 92 88 96 104 C100 122 92 138 60 138 C28 138 20 122 24 104 C28 88 26 78 26 62 C26 40 36 22 60 22 Z';
/** Cream patch from the muzzle down to the belly. */
const FACE_AND_BELLY = 'M60 50 C74 50 84 58 84 70 C84 78 80 83 82 93 C85 112 76 130 60 130 C44 130 35 112 38 93 C40 83 36 78 36 70 C36 58 46 50 60 50 Z';
/** Shadow side of the body, down the right flank. */
const FLANK_SHADE = 'M89 72 C91 90 96 110 90 126 C86 133 78 136 70 137 C84 124 89 100 86 78 Z';
/** Shadow side of the cream patch, plus the soft shadow the muzzle casts on the chest. */
const BELLY_SHADE = 'M76 56 C84 62 86 74 82 84 C80 92 84 106 80 118 C76 126 70 129 64 130 C74 118 77 102 75 90 C73 78 80 66 76 56 Z';
const CHIN_SHADE = 'M45 86 Q60 97 75 86 Q60 92 45 86 Z';
const SIDE_BEAN = 'M62 22 C84 22 92 40 92 62 C92 78 92 88 95 104 C98 122 90 138 64 138 C40 138 30 124 32 106 C34 92 34 84 32 76 C30 52 40 22 62 22 Z';

const shade = (d: string): string => el('path', { d, fill: SHADE, ...NO_STROKE });
const highlight = (d: string, width = 3): string =>
  el('path', { d, fill: 'none', stroke: LIT, 'stroke-width': width, 'stroke-linecap': 'round' });

/** The flat, scaly paddle tail, shaded underneath and catching light along the top. */
function tail(cx: number, cy: number, rx: number, ry: number, rotation: number): string {
  const scales: string[] = [];
  for (let i = -2; i <= 2; i++) {
    const x = (i * rx) / 3.2;
    scales.push(el('line', { x1: x, y1: -ry * 0.5, x2: x, y2: ry * 0.5 }));
  }
  scales.push(el('line', { x1: -rx * 0.72, y1: 0, x2: rx * 0.72, y2: 0 }));
  return group({ transform: `translate(${cx} ${cy}) rotate(${rotation})` }, [
    el('ellipse', { cx: 0, cy: 0, rx, ry, fill: TAIL, ...NO_STROKE }),
    el('ellipse', { cx: rx * 0.12, cy: ry * 0.3, rx: rx * 0.86, ry: ry * 0.68, fill: SHADE, ...NO_STROKE }),
    group({ stroke: TAIL_SCALES, 'stroke-width': 1.4, opacity: 0.8 }, scales),
    highlight(`M${-rx * 0.62} ${-ry * 0.32} Q0 ${-ry * 0.78} ${rx * 0.42} ${-ry * 0.56}`, 2.4),
    el('ellipse', { cx: 0, cy: 0, rx, ry, fill: 'none', 'stroke-width': PART }),
  ]);
}

function nose(cx: number, cy: number): string {
  return [
    el('path', { d: `M${cx - 5} ${cy - 2} Q${cx} ${cy - 4} ${cx + 5} ${cy - 2} Q${cx + 2} ${cy + 3} ${cx} ${cy + 3} Q${cx - 2} ${cy + 3} ${cx - 5} ${cy - 2} Z`, fill: NOSE, 'stroke-width': 1.8 }),
    el('ellipse', { cx: cx - 1.6, cy: cy - 1.4, rx: 1.4, ry: 0.8, fill: '#fff', opacity: 0.7, ...NO_STROKE }),
  ].join('');
}

/** The little "w" mouth with two buck teeth peeking out under it. */
function mouth(cx: number, cy: number): string {
  return [
    el('rect', { x: cx - 4, y: cy, width: 4, height: 6.5, rx: 1, fill: TEETH, 'stroke-width': 1.6 }),
    el('rect', { x: cx, y: cy, width: 4, height: 6.5, rx: 1, fill: TEETH, 'stroke-width': 1.6 }),
    el('rect', { x: cx, y: cy + 3.5, width: 4, height: 3, fill: SHADE, ...NO_STROKE }),
    el('path', { d: `M${cx - 7} ${cy - 1} Q${cx - 3.5} ${cy + 2} ${cx} ${cy - 1} Q${cx + 3.5} ${cy + 2} ${cx + 7} ${cy - 1}`, fill: 'none', 'stroke-width': 2.2 }),
  ].join('');
}

const blush = (cx: number, cy: number): string =>
  el('ellipse', { cx, cy, rx: 5, ry: 2.8, fill: BLUSH, opacity: 0.45, ...NO_STROKE });

/** Pointy fur tufts sticking out of a cheek; `side` is -1 for left, 1 for right. */
function cheekTuft(x: number, y: number, side: number, fill: string): string {
  const s = side;
  return el('path', {
    d: `M${x} ${y - 9} L${x + s * 13} ${y - 5} L${x + s * 4} ${y - 1} L${x + s * 11} ${y + 4} L${x} ${y + 6} Z`,
    fill,
    'stroke-width': PART,
  });
}

/** Stubby nub foot; a lit foot catches a highlight, a shaded one sits in shadow. */
function foot(cx: number, cy: number, palette: FurPalette, lit: boolean): string {
  return [
    el('ellipse', { cx, cy, rx: 11, ry: 6.5, fill: palette.shade, 'stroke-width': PART }),
    lit ? highlight(`M${cx - 7} ${cy - 2} Q${cx - 2} ${cy - 5} ${cx + 3} ${cy - 4}`, 2.2) : el('ellipse', { cx, cy: cy + 1.5, rx: 9, ry: 4.5, fill: SHADE, ...NO_STROKE }),
  ].join('');
}

/** Stubby nub arm hanging from the side, pivoting at the shoulder. */
function arm(cx: number, cy: number, angle: number, palette: FurPalette, lit: boolean): string {
  return group({ transform: `rotate(${angle} ${cx} ${cy - 9})` }, [
    el('ellipse', { cx, cy, rx: 7, ry: 13, fill: palette.base, 'stroke-width': PART }),
    lit
      ? highlight(`M${cx - 3.5} ${cy - 8} Q${cx - 5.5} ${cy} ${cx - 3.5} ${cy + 7}`, 2.2)
      : el('ellipse', { cx: cx + 1.5, cy, rx: 5, ry: 11, fill: SHADE, ...NO_STROKE }),
  ]);
}

/** How far each foot lifts for a walk step: [left, right]. */
const footLift = (step: WalkStep): [number, number] => (step === 1 ? [5, 0] : step === 2 ? [0, 5] : [0, 0]);
/** Arms swing opposite to the legs. */
const armSwing = (step: WalkStep): number => (step === 1 ? 12 : step === 2 ? -12 : 0);

function frontFeet(step: WalkStep, palette: FurPalette): string {
  const [left, right] = footLift(step);
  return foot(46, 139 - left, palette, true) + foot(74, 139 - right, palette, false);
}

/** Round ears; the right one sits in shadow. */
const ears = (palette: FurPalette): string =>
  [
    el('circle', { cx: 35, cy: 31, r: 8, fill: palette.base, 'stroke-width': PART }),
    el('circle', { cx: 85, cy: 31, r: 8, fill: palette.base, 'stroke-width': PART }),
    el('circle', { cx: 35, cy: 31, r: 3.6, fill: palette.shade, ...NO_STROKE }),
    el('circle', { cx: 85, cy: 31, r: 3.6, fill: palette.shade, ...NO_STROKE }),
    el('circle', { cx: 86, cy: 32, r: 7, fill: SHADE, ...NO_STROKE }),
  ].join('');

function frontView(palette: FurPalette, face: FaceId, pose: AvatarPose): string {
  const swing = armSwing(pose.step);
  const upper = group({ transform: `translate(0 ${strideBob(pose.step)})` }, [
    ears(palette),
    cheekTuft(28, 68, -1, palette.base),
    cheekTuft(92, 68, 1, palette.shade),
    el('path', { d: BEAN, fill: palette.base, 'stroke-width': SILHOUETTE }),
    el('path', { d: FLANK_SHADE, fill: palette.shade, ...NO_STROKE }),
    el('path', { d: FACE_AND_BELLY, fill: palette.light, ...NO_STROKE }),
    shade(BELLY_SHADE),
    shade(CHIN_SHADE),
    highlight('M33 54 Q35 34 52 26', 3.2),
    highlight('M44 100 Q41 112 46 122', 2.6),
    el('path', { d: 'M58 30 Q61 23 64 30', fill: 'none', 'stroke-width': 2.2 }),
    renderEyes(face, [{ x: 49, y: 60, side: -1 }, { x: 71, y: 60, side: 1 }], pose.blink, palette),
    blush(40, 71),
    blush(80, 71),
    mouth(60, 74),
    nose(60, 68),
    arm(26, 101, 22 + swing, palette, true),
    arm(94, 101, -22 + swing, palette, false),
  ]);
  return [tail(90, 130, 22, 8.5, -24), frontFeet(pose.step, palette), upper].join('');
}

function backView(palette: FurPalette, pose: AvatarPose): string {
  const swing = -armSwing(pose.step);
  const upper = group({ transform: `translate(0 ${strideBob(pose.step)})` }, [
    cheekTuft(28, 68, -1, palette.base),
    cheekTuft(92, 68, 1, palette.shade),
    el('path', { d: BEAN, fill: palette.base, 'stroke-width': SILHOUETTE }),
    el('path', { d: FLANK_SHADE, fill: palette.shade, ...NO_STROKE }),
    highlight('M33 54 Q35 34 52 26', 3.2),
    highlight('M31 76 Q30 96 34 112', 2.6),
    ears(palette),
    el('path', { d: 'M50 62 Q54 67 51 72 M62 70 Q66 75 63 80 M72 60 Q76 65 73 70', fill: 'none', stroke: palette.shade, 'stroke-width': 2.2 }),
    arm(26, 101, 22 + swing, palette, true),
    arm(94, 101, -22 + swing, palette, false),
    tail(60, 126, 16, 18, 0),
  ]);
  return [frontFeet(pose.step, palette), upper].join('');
}

/** Drawn facing left. */
function sideView(palette: FurPalette, face: FaceId, pose: AvatarPose): string {
  const stride = pose.step === 1 ? 6 : pose.step === 2 ? -6 : 0;
  const swing = stride * 2.2;
  const upper = group({ transform: `translate(0 ${strideBob(pose.step)})` }, [
    el('circle', { cx: 78, cy: 30, r: 8, fill: palette.base, 'stroke-width': PART }),
    el('circle', { cx: 78, cy: 30, r: 3.6, fill: palette.shade, ...NO_STROKE }),
    cheekTuft(84, 68, 1, palette.shade),
    el('path', { d: SIDE_BEAN, fill: palette.base, 'stroke-width': SILHOUETTE }),
    el('path', { d: 'M88 74 C90 92 95 112 88 127 C84 133 77 136 70 137 C83 124 87 100 84 80 Z', fill: palette.shade, ...NO_STROKE }),
    el('ellipse', { cx: 31, cy: 70, rx: 15, ry: 11.5, fill: palette.light, 'stroke-width': PART }),
    // Cream patch: covers the head outline where the snout joins, then runs down the belly.
    el('path', { d: 'M30 62 C40 54 54 58 56 70 C58 84 52 92 54 104 C56 120 50 132 40 132 C34 128 32 116 34 104 C36 90 34 80 30 76 Z', fill: palette.light, ...NO_STROKE }),
    shade('M48 86 C54 96 52 110 54 122 C52 128 48 131 44 132 C50 118 50 100 48 86 Z'),
    shade('M24 76 Q34 82 44 76 Q34 79 24 76 Z'),
    highlight('M38 44 Q44 29 60 25', 3.2),
    highlight('M21 62 Q27 57 35 58', 2.2),
    highlight('M38 100 Q36 112 40 122', 2.6),
    el('path', { d: 'M59 30 Q62 23 65 30', fill: 'none', 'stroke-width': 2.2 }),
    renderEyes(face, [{ x: 43, y: 59, side: -1 }], pose.blink, palette),
    blush(50, 72),
    el('rect', { x: 23, y: 74, width: 4.5, height: 6.5, rx: 1, fill: TEETH, 'stroke-width': 1.6 }),
    el('path', { d: 'M19 73 Q24 76 30 73', fill: 'none', 'stroke-width': 2.2 }),
    nose(18, 66),
    arm(60, 101, swing, palette, true),
  ]);
  return [
    el('ellipse', { cx: 62, cy: 142, rx: 30, ry: 6, fill: SHADOW, ...NO_STROKE }),
    tail(98, 126, 22, 7.5, 12),
    foot(70 - stride, 139 - (stride > 0 ? 4 : 0), palette, false),
    foot(52 + stride, 139 - (stride < 0 ? 4 : 0), palette, true),
    upper,
  ].join('');
}

/** Body layer: everything except accessories. Recolored entirely by the palette. */
export function renderBodyLayer(palette: FurPalette, face: FaceId, pose: AvatarPose, viewBox?: string): string {
  const ink = {
    stroke: palette.outline,
    'stroke-width': 2.4,
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
  };

  if (pose.direction === 'left' || pose.direction === 'right') {
    return svgDocument(handDrawn(group(ink, [orient(pose.direction, sideView(palette, face, pose))])), viewBox);
  }

  const shadow = el('ellipse', { cx: 60, cy: 142, rx: 34, ry: 6.5, fill: SHADOW, stroke: 'none' });
  const view = pose.direction === 'front' ? frontView(palette, face, pose) : backView(palette, pose);
  return svgDocument(shadow + handDrawn(group(ink, [view])), viewBox);
}

/** Just the head, front-facing, for face pickers. */
export function renderFaceThumbnail(palette: FurPalette, face: FaceId): string {
  return renderBodyLayer(palette, face, { direction: 'front', step: 0, blink: false }, '22 20 76 70');
}
