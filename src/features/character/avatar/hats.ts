import type { HatId } from '../appearance';
import { strideBob, type AvatarPose } from './pose';
import { el, group, handDrawn, orient, svgDocument } from './svg';

const OUTLINE = '#2a1d17';

/** Front and back share one drawing; side views are drawn facing left. */
interface HatDrawing {
  front: string;
  back: string;
  side: string;
}

type DrawableHat = Exclude<HatId, 'none'>;

function baseballCap(): HatDrawing {
  const red = '#d6553a';
  const shade = '#a93e2a';
  const dome = 'M26 41 C26 14 44 7 60 7 C76 7 94 14 94 41 Z';
  const seams = el('path', { d: 'M60 8 L60 40 M44 12 Q40 26 41 40 M76 12 Q80 26 79 40', fill: 'none', stroke: shade, 'stroke-width': 1.8 });
  const button = el('circle', { cx: 60, cy: 8, r: 3, fill: shade });
  const emblem = [
    el('circle', { cx: 60, cy: 25, r: 6.5, fill: '#fbeedb' }),
    el('rect', { x: 55.5, y: 23, width: 9, height: 4.5, rx: 2.2, fill: '#9a5b34', 'stroke-width': 1.4 }),
  ].join('');

  return {
    front: [
      el('path', { d: dome, fill: red }),
      seams,
      button,
      emblem,
      el('path', { d: 'M27 38 Q60 30 93 38 Q95 47 60 47 Q25 47 27 38 Z', fill: shade }),
    ].join(''),
    back: [
      el('path', { d: dome, fill: red }),
      seams,
      button,
      el('path', { d: 'M49 41 Q49 31 60 31 Q71 31 71 41 Z', fill: '#7a2c1e' }),
      el('rect', { x: 47, y: 36, width: 26, height: 3.5, rx: 1.7, fill: shade, 'stroke-width': 1.6 }),
    ].join(''),
    side: [
      el('path', { d: 'M12 41 Q14 35 40 36 L44 43 Q24 45 14 45 Q11 44 12 41 Z', fill: shade }),
      el('path', { d: 'M36 41 C36 15 52 8 66 8 C82 8 94 18 94 41 Z', fill: red }),
      el('path', { d: 'M66 9 Q71 24 69 40', fill: 'none', stroke: shade, 'stroke-width': 1.8 }),
      el('circle', { cx: 66, cy: 9, r: 3, fill: shade }),
      el('circle', { cx: 48, cy: 26, r: 5.5, fill: '#fbeedb' }),
    ].join(''),
  };
}

function beanie(): HatDrawing {
  const teal = '#3f8079';
  const cuff = '#2f6660';
  const yarn = '#f3e2bd';
  const ribs = (from: number, to: number, top: number) => {
    const lines: string[] = [];
    for (let x = from; x <= to; x += 6) lines.push(el('line', { x1: x, y1: top + 2.5, x2: x, y2: top + 8.5 }));
    return group({ stroke: '#245550', 'stroke-width': 1.5 }, lines);
  };
  const pompom = (cx: number, cy: number) =>
    [
      el('circle', { cx, cy, r: 7.5, fill: yarn }),
      el('path', { d: `M${cx - 3} ${cy - 2} l1.5 1.5 M${cx + 2} ${cy - 3} l1.5 1.5 M${cx - 1} ${cy + 2} l1.5 1.5`, stroke: '#d8c296', 'stroke-width': 1.4 }),
    ].join('');

  const front = [
    el('path', { d: 'M27 39 C27 10 44 3 60 3 C76 3 93 10 93 39 Z', fill: teal }),
    el('path', { d: 'M30 24 Q60 17 90 24 L91.5 31 Q60 24 28.5 31 Z', fill: yarn, 'stroke-width': 1.8 }),
    el('rect', { x: 25, y: 32, width: 70, height: 12, rx: 6, fill: cuff }),
    ribs(31, 89, 32),
    pompom(60, 4),
  ].join('');

  return {
    front,
    back: front,
    side: [
      el('path', { d: 'M34 39 C34 12 50 4 64 4 C80 4 93 14 93 39 Z', fill: teal }),
      el('path', { d: 'M36 24 Q64 17 91 24 L92 31 Q64 24 34.5 31 Z', fill: yarn, 'stroke-width': 1.8 }),
      el('rect', { x: 31, y: 31, width: 64, height: 12, rx: 6, fill: cuff }),
      ribs(37, 89, 31),
      pompom(68, 5),
    ].join(''),
  };
}

function strawHat(): HatDrawing {
  const straw = '#e9c46a';
  const weave = '#c49a3f';
  const band = '#b8452f';
  const sprig = (cx: number, cy: number, angle: number) =>
    [
      el('ellipse', { cx, cy, rx: 5.5, ry: 2.6, fill: '#6f9a4a', transform: `rotate(${angle} ${cx} ${cy})`, 'stroke-width': 1.5 }),
      el('circle', { cx: cx + 3, cy: cy + 2, r: 2.4, fill: '#fff4e0', 'stroke-width': 1.3 }),
    ].join('');
  const front = [
    el('ellipse', { cx: 60, cy: 36, rx: 50, ry: 9.5, fill: straw }),
    el('path', { d: 'M19 38 Q60 47 101 38 M28 33 Q60 40 92 33', fill: 'none', stroke: weave, 'stroke-width': 1.4 }),
    el('path', { d: 'M37 37 C37 20 44 10 60 10 C76 10 83 20 83 37 Z', fill: straw }),
    el('path', { d: 'M43 19 Q60 15 77 19', fill: 'none', stroke: weave, 'stroke-width': 1.4 }),
    el('path', { d: 'M37.5 28 Q60 32 82.5 28 L83 36 Q60 40 37 36 Z', fill: band, 'stroke-width': 2 }),
    sprig(76, 31, -30),
  ].join('');

  return {
    front,
    back: front,
    side: [
      el('ellipse', { cx: 63, cy: 37, rx: 48, ry: 7.5, fill: straw }),
      el('path', { d: 'M22 38 Q63 45 104 38', fill: 'none', stroke: weave, 'stroke-width': 1.4 }),
      el('path', { d: 'M44 38 C44 20 52 11 64 11 C78 11 84 20 84 38 Z', fill: straw }),
      el('path', { d: 'M49 20 Q64 16 79 20', fill: 'none', stroke: weave, 'stroke-width': 1.4 }),
      el('path', { d: 'M44.5 29 Q64 32 83.5 29 L84 37 Q64 40 44 37 Z', fill: band, 'stroke-width': 2 }),
      sprig(52, 32, -150),
    ].join(''),
  };
}

function explorerHat(): HatDrawing {
  const felt = '#8a5b3b';
  const crease = '#6a432a';
  const band = '#3f2a1c';
  const feather = (path: string, quill: string) =>
    [el('path', { d: path, fill: '#c94a35' }), el('path', { d: quill, fill: 'none', stroke: '#f0c76a', 'stroke-width': 1.4 })].join('');
  const front = [
    el('path', { d: 'M12 38 Q20 30 30 35 Q60 44 90 35 Q100 30 108 38 Q100 48 60 48 Q20 48 12 38 Z', fill: felt }),
    feather('M78 30 Q92 12 99 3 Q96 18 84 32 Z', 'M81 31 Q91 16 98 5'),
    el('path', { d: 'M35 37 L38 16 Q48 6 60 13 Q72 6 82 16 L85 37 Z', fill: felt }),
    el('path', { d: 'M60 13 L60 21', fill: 'none', stroke: crease, 'stroke-width': 2 }),
    el('path', { d: 'M36.5 28 L83.5 28 L85 37 L35 37 Z', fill: band, 'stroke-width': 2 }),
  ].join('');

  return {
    front,
    back: front,
    side: [
      feather('M78 30 Q94 14 104 6 Q98 20 84 33 Z', 'M81 31 Q94 18 102 8'),
      el('path', { d: 'M40 38 L44 16 Q58 7 80 14 L85 38 Z', fill: felt }),
      el('path', { d: 'M58 11 Q62 16 60 22', fill: 'none', stroke: crease, 'stroke-width': 2 }),
      el('path', { d: 'M41.5 29 L84 29 L85 37 L40 37 Z', fill: band, 'stroke-width': 2 }),
      el('path', { d: 'M12 41 Q20 34 40 36 L86 36 Q100 34 110 39 Q100 46 62 46 Q24 46 12 41 Z', fill: felt }),
    ].join(''),
  };
}

const HAT_DRAWINGS: Record<DrawableHat, HatDrawing> = {
  'baseball-cap': baseballCap(),
  beanie: beanie(),
  'straw-hat': strawHat(),
  'explorer-hat': explorerHat(),
};

const STROKE_STYLE = {
  stroke: OUTLINE,
  'stroke-width': 2.5,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
};

/**
 * Cel shading that works for any hat: like the room and the beaver, light comes from the
 * upper left, so a hard-edged shadow covers the lower-right part, clipped to the hat's
 * own silhouette. Must sit inside the inked group so the mask copy inherits its strokes.
 */
function celShaded(markup: string): string {
  return (
    '<defs>' +
    '<filter id="hat-silhouette"><feFlood flood-color="#fff"/><feComposite in2="SourceAlpha" operator="in"/></filter>' +
    `<mask id="hat-shape" maskUnits="userSpaceOnUse" x="-20" y="-20" width="160" height="190"><g filter="url(#hat-silhouette)">${markup}</g></mask>` +
    '<linearGradient id="hat-light" gradientUnits="userSpaceOnUse" x1="36" y1="2" x2="96" y2="46">' +
    '<stop offset="0.56" stop-color="#46240e" stop-opacity="0"/><stop offset="0.56" stop-color="#46240e" stop-opacity="0.28"/>' +
    '</linearGradient></defs>' +
    markup +
    el('rect', { x: -20, y: -20, width: 160, height: 190, fill: 'url(#hat-light)', mask: 'url(#hat-shape)', stroke: 'none' })
  );
}

function hatMarkup(hat: DrawableHat, direction: AvatarPose['direction']): string {
  const drawing = HAT_DRAWINGS[hat];
  if (direction === 'front') return drawing.front;
  if (direction === 'back') return drawing.back;
  return orient(direction, drawing.side);
}

/**
 * Hat layer on the shared avatar canvas, or null for "no hat".
 * It follows the head's stride bob so it stays seated while walking.
 */
export function renderHatLayer(hat: HatId, pose: AvatarPose): string | null {
  if (hat === 'none') return null;
  return svgDocument(
    handDrawn(
      group({ ...STROKE_STYLE, transform: `translate(0 ${strideBob(pose.step)})` }, [celShaded(hatMarkup(hat, pose.direction))]),
    ),
  );
}

/** Hat alone, cropped to its bounds — for pickers and thumbnails. */
export function renderHatThumbnail(hat: DrawableHat): string {
  return svgDocument(handDrawn(group(STROKE_STYLE, [celShaded(HAT_DRAWINGS[hat].front)])), '6 -6 108 58');
}
