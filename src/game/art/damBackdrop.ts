import { el, group, svgDocument } from '../../features/character/avatar/svg';
import type { Vec2 } from '../../types/geometry';
import { FLOOR_OUTLINE, TOWER, WORLD_HEIGHT, WORLD_WIDTH } from '../damLayout';

/**
 * The painted room, in the style of a classic online-hangout room: a close camera, a big
 * landmark (the log lookout tower) framing an open plank floor, cel-shaded shapes with a lit
 * and a shadow side, foreground rocks cut off by the frame, and a hand-drawn wobble over
 * every line. Things that move, and props beavers walk behind, are layered on by the scene.
 */

const INK = '#2a1d17';
/** Vanishing point the deck planks run towards, far above the screen. */
const VANISHING_POINT = { x: 960, y: -1500 };
/** The dam face drops this far below the deck's front edge before reaching the river. */
const FACE_DEPTH = 92;

const inked = (children: string[], width = 4.5) =>
  group({ stroke: INK, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, children);

/** Deterministic pseudo-random numbers so the painting is identical on every load. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/** A smooth closed (or open) curve through points, Catmull-Rom style. */
function smoothPath(points: readonly Vec2[], closed = true): string {
  const n = points.length;
  const at = (i: number) => points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))]!;
  let d = `M${at(0).x} ${at(0).y}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x} ${p2.y}`;
  }
  return closed ? `${d} Z` : d;
}

/** A lumpy blob around a center, for rocks and bushes. */
function blob(cx: number, cy: number, rx: number, ry: number, random: () => number, points = 8): Vec2[] {
  return Array.from({ length: points }, (_, i) => {
    const angle = (i / points) * Math.PI * 2;
    const wobble = 0.82 + random() * 0.3;
    return { x: cx + Math.cos(angle) * rx * wobble, y: cy + Math.sin(angle) * ry * wobble };
  });
}

/** The front edge of the deck, left to right. */
const FRONT_EDGE: readonly Vec2[] = FLOOR_OUTLINE.slice(6, 12).reverse();

function frontEdgeY(x: number): number {
  for (let i = 0; i < FRONT_EDGE.length - 1; i++) {
    const a = FRONT_EDGE[i]!;
    const b = FRONT_EDGE[i + 1]!;
    if (x >= a.x && x <= b.x) return a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
  }
  return FRONT_EDGE[FRONT_EDGE.length - 1]!.y;
}

function defs(): string {
  const floor = smoothPath(FLOOR_OUTLINE);
  return `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d5fae"/><stop offset="0.55" stop-color="#4aa3e0"/><stop offset="1" stop-color="#a6dbf3"/>
    </linearGradient>
    <linearGradient id="pond" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3f9fdc"/><stop offset="1" stop-color="#1f74b8"/>
    </linearGradient>
    <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a86c9"/><stop offset="1" stop-color="#57b9ea"/>
    </linearGradient>
    <radialGradient id="floor-light" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff2d2" stop-opacity="0.85"/><stop offset="1" stop-color="#fff2d2" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="floor-clip"><path d="${floor}"/></clipPath>
    <clipPath id="tower-clip"><path d="${towerBody()}"/></clipPath>
    <filter id="hand-drawn" x="-1%" y="-1%" width="102%" height="102%">
      <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="4" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>`;
}

function sky(): string {
  return el('rect', { x: -20, y: -20, width: WORLD_WIDTH + 40, height: 330, fill: 'url(#sky)' });
}

/** A pine with drooping, scalloped tiers: lit on the left, shaded on the right. */
function pine(x: number, base: number, height: number): string {
  const tiers: string[] = [];
  for (let t = 0; t < 4; t++) {
    const top = base - height + t * height * 0.2;
    const bottom = top + height * 0.34;
    const half = height * (0.16 + t * 0.07);
    const outline = `M${x} ${top} Q${x + half * 0.5} ${bottom - height * 0.12} ${x + half} ${bottom} Q${x + half * 0.5} ${bottom - 6} ${x} ${bottom + 4} Q${x - half * 0.5} ${bottom - 6} ${x - half} ${bottom} Q${x - half * 0.5} ${bottom - height * 0.12} ${x} ${top} Z`;
    const lit = `M${x} ${top} Q${x - half * 0.5} ${bottom - height * 0.12} ${x - half} ${bottom} Q${x - half * 0.5} ${bottom - 6} ${x} ${bottom + 4} Z`;
    tiers.push(el('path', { d: outline, fill: '#22683f', stroke: 'none' }));
    tiers.push(el('path', { d: lit, fill: '#3f9a5a', stroke: 'none' }));
    tiers.push(el('path', { d: outline, fill: 'none' }));
  }
  return [el('rect', { x: x - 9, y: base - 10, width: 18, height: 30, fill: '#6b4226' }), ...tiers].join('');
}

function distance(): string {
  const random = seeded(7);
  const trees: string[] = [];
  for (let x = 460; x < 1560; x += 54 + random() * 30) {
    const h = 90 + random() * 50;
    trees.push(el('path', { d: `M${x} ${300 - h} L${x + h * 0.28} 300 L${x - h * 0.28} 300 Z`, fill: '#3d8a6b', stroke: '#2a5e4b', 'stroke-width': 3 }));
  }
  return [
    el('path', { d: 'M-20 250 Q200 120 420 190 Q640 250 820 170 Q1060 80 1300 180 Q1520 260 1700 150 Q1820 90 1940 140 V320 H-20 Z', fill: '#7fbcc6', stroke: '#4f8ea0', 'stroke-width': 4 }),
    el('path', { d: 'M820 170 Q900 205 960 240 M1300 180 Q1380 230 1460 250', fill: 'none', stroke: '#a9d8de', 'stroke-width': 6 }),
    ...trees,
  ].join('');
}

function pond(): string {
  const random = seeded(11);
  const curls: string[] = [];
  for (let i = 0; i < 22; i++) {
    const x = 380 + random() * 1200;
    const y = 300 + random() * 100;
    curls.push(`M${x} ${y} q12 -10 24 0 q12 10 24 0`);
  }
  return [
    el('rect', { x: -20, y: 288, width: WORLD_WIDTH + 40, height: 260, fill: 'url(#pond)', stroke: INK, 'stroke-width': 4.5 }),
    el('path', { d: curls.join(' '), fill: 'none', stroke: '#cdeefc', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.85 }),
  ].join('');
}

/** Rounded boulders: dark shadow body, a lit face up-left and a bright rim highlight. */
function rocks(cx: number, cy: number, scale: number, seed: number, count = 4): string {
  const random = seeded(seed);
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = cx + (random() - 0.5) * 220 * scale;
    const y = cy + (random() - 0.5) * 70 * scale;
    const rx = (52 + random() * 40) * scale;
    const ry = rx * (0.62 + random() * 0.2);
    const shape = blob(x, y, rx, ry, random);
    parts.push(el('path', { d: smoothPath(shape), fill: '#3f4856', stroke: 'none' }));
    parts.push(el('path', { d: smoothPath(blob(x - rx * 0.16, y - ry * 0.2, rx * 0.74, ry * 0.66, random)), fill: '#5d6b7d', stroke: 'none' }));
    parts.push(el('path', { d: `M${x - rx * 0.6} ${y - ry * 0.3} Q${x - rx * 0.3} ${y - ry * 0.85} ${x + rx * 0.2} ${y - ry * 0.75}`, fill: 'none', stroke: '#a7b5c6', 'stroke-width': 6 * scale }));
    parts.push(el('path', { d: smoothPath(shape), fill: 'none' }));
  }
  return inked(parts, 5);
}

function banks(): string {
  const left = 'M-20 300 Q140 300 300 420 Q420 500 290 566 Q170 640 136 716 Q130 800 180 862 Q110 960 150 1100 H-20 Z';
  const right = 'M1530 432 Q1640 300 1940 250 V1100 H1800 Q1840 960 1760 862 Q1830 780 1800 720 Q1780 620 1700 556 Q1620 480 1530 432 Z';
  return inked([
    el('path', { d: left, fill: '#5fb548' }),
    el('path', { d: 'M-20 330 Q120 330 250 420 Q330 480 250 540', fill: 'none', stroke: '#8ed66a', 'stroke-width': 12 }),
    el('path', { d: right, fill: '#5fb548' }),
    el('path', { d: 'M1560 432 Q1660 330 1940 290', fill: 'none', stroke: '#8ed66a', 'stroke-width': 12 }),
    el('path', { d: 'M1790 860 Q1860 760 1940 740 V1100 H1810 Z', fill: '#479a3a', stroke: 'none' }),
  ]);
}

/** Planks run towards a vanishing point far above, so the deck reads as a floor in perspective. */
function deck(): string {
  const random = seeded(5);
  const floor = smoothPath(FLOOR_OUTLINE);
  const towards = (xBottom: number, y: number) =>
    xBottom + (VANISHING_POINT.x - xBottom) * ((1000 - y) / (1000 - VANISHING_POINT.y));
  const strips: string[] = [];
  const seams: string[] = [];
  const nails: string[] = [];
  const step = 74;
  for (let i = 0, x = 20; x < 1900; i++, x += step) {
    const quad = `M${x} 1000 L${x + step} 1000 L${towards(x + step, 360)} 360 L${towards(x, 360)} 360 Z`;
    strips.push(el('path', { d: quad, fill: i % 2 ? '#e7b273' : '#ddaa6b', stroke: '#b57a43', 'stroke-width': 3 }));
    for (let y = 390 + random() * 80; y < 990; y += 120 + random() * 110) {
      const a = towards(x, y);
      const b = towards(x + step, y);
      seams.push(`M${a} ${y} L${b} ${y}`);
      nails.push(el('circle', { cx: a + (b - a) * 0.2, cy: y - 7, r: 2.6, fill: '#8a5a34', stroke: 'none' }));
      nails.push(el('circle', { cx: a + (b - a) * 0.8, cy: y - 7, r: 2.6, fill: '#8a5a34', stroke: 'none' }));
    }
  }
  return [
    group({ 'clip-path': 'url(#floor-clip)' }, [
      ...strips,
      el('path', { d: seams.join(' '), stroke: '#b57a43', 'stroke-width': 3 }),
      ...nails,
      el('ellipse', { cx: 980, cy: 680, rx: 620, ry: 210, fill: 'url(#floor-light)' }),
      // Soft shade where the deck meets its edges.
      el('path', { d: floor, fill: 'none', stroke: '#7a4a28', 'stroke-width': 70, opacity: 0.22 }),
    ]),
    el('path', { d: floor, fill: 'none', stroke: INK, 'stroke-width': 5 }),
  ].join('');
}

/** The back of the dam: a bristle of sticks and mud holding back the pond. */
function stickWall(): string {
  const random = seeded(29);
  const back = FLOOR_OUTLINE.slice(0, 6);
  const sticks: string[] = [];
  for (let i = 0; i < back.length - 1; i++) {
    const a = back[i]!;
    const b = back[i + 1]!;
    for (let t = 0; t < 1; t += 0.09 + random() * 0.05) {
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const lean = (random() - 0.5) * 40;
      sticks.push(`M${x} ${y + 4} l${lean} -${34 + random() * 26}`);
    }
  }
  return inked([
    el('path', { d: smoothPath(back, false), fill: 'none', stroke: '#6e4426', 'stroke-width': 20 }),
    el('path', { d: sticks.join(' '), stroke: INK, 'stroke-width': 11 }),
    el('path', { d: sticks.join(' '), stroke: '#a26a3a', 'stroke-width': 5 }),
  ]);
}

/** The dam face under the front edge: two rows of cel-shaded log ends over mud and sticks. */
function damFace(): string {
  const random = seeded(19);
  const top = smoothPath(FRONT_EDGE, false);
  const bottom = smoothPath([...FRONT_EDGE].reverse().map((p) => ({ x: p.x, y: p.y + FACE_DEPTH })), false).replace(/^M/, 'L');
  const logs: string[] = [];
  [30, 66].forEach((drop, row) => {
    for (let x = FRONT_EDGE[0]!.x + 20 + row * 22; x < FRONT_EDGE[FRONT_EDGE.length - 1]!.x - 10; x += 44 + random() * 10) {
      if (Math.abs(x - 960) < 110) continue; // spillway
      const y = frontEdgeY(x) + drop;
      const r = 19 + random() * 5;
      logs.push(el('circle', { cx: x, cy: y, r, fill: '#c88a50' }));
      logs.push(el('circle', { cx: x - r * 0.12, cy: y - r * 0.12, r: r * 0.78, fill: '#f1c58c', stroke: 'none' }));
      logs.push(el('circle', { cx: x - r * 0.1, cy: y - r * 0.1, r: r * 0.42, fill: 'none', stroke: '#c88a50', 'stroke-width': 3 }));
      logs.push(el('circle', { cx: x, cy: y, r, fill: 'none' }));
    }
  });
  return inked([
    el('path', { d: `${top} ${bottom} Z`, fill: '#6e4426' }),
    ...logs,
    el('rect', { x: 850, y: frontEdgeY(850) + 4, width: 220, height: FACE_DEPTH, fill: '#3d2a1e' }),
    // Thick log lip along the front edge of the deck.
    el('path', { d: top, fill: 'none', stroke: INK, 'stroke-width': 24 }),
    el('path', { d: top, fill: 'none', stroke: '#b9743d', 'stroke-width': 15 }),
    el('path', { d: top, fill: 'none', stroke: '#e0a463', 'stroke-width': 4, 'stroke-dasharray': '70 110', transform: 'translate(0 -3)' }),
  ]);
}

function river(): string {
  const random = seeded(31);
  const curls: string[] = [];
  for (let i = 0; i < 26; i++) {
    const x = 120 + random() * 1700;
    const y = 1000 + random() * 70;
    curls.push(`M${x} ${y} q14 -12 28 0 q14 12 28 0`);
  }
  const foam: Vec2[] = [];
  for (let x = 150; x <= 1790; x += 40) foam.push({ x, y: frontEdgeY(x) + FACE_DEPTH + (random() - 0.5) * 8 });
  return [
    el('rect', { x: -20, y: 880, width: WORLD_WIDTH + 40, height: 240, fill: 'url(#river)', stroke: INK, 'stroke-width': 4.5 }),
    el('path', { d: curls.join(' '), fill: 'none', stroke: '#d6f2fd', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    el('path', { d: smoothPath(foam, false), fill: 'none', stroke: '#9fd3ee', 'stroke-width': 22, 'stroke-linecap': 'round' }),
    el('path', { d: smoothPath(foam, false), fill: 'none', stroke: '#f4fcff', 'stroke-width': 12, 'stroke-linecap': 'round' }),
  ].join('');
}

function towerBody(): string {
  const { x, baseY, halfWidth } = TOWER;
  return `M${x - halfWidth} ${baseY} Q${x} ${baseY + 50} ${x + halfWidth} ${baseY} L${x + halfWidth - 30} -40 L${x - halfWidth + 30} -40 Z`;
}

function porthole(cx: number, cy: number, r: number): string {
  const bolts = [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (i / 6) * Math.PI * 2;
    return el('circle', { cx: cx + Math.cos(a) * r * 0.86, cy: cy + Math.sin(a) * r * 0.86, r: 3, fill: '#d9b27a', 'stroke-width': 2 });
  });
  return [
    el('circle', { cx, cy, r, fill: '#7a4a28' }),
    el('circle', { cx, cy, r: r * 0.68, fill: '#245f97' }),
    el('path', { d: `M${cx - r * 0.45} ${cy + r * 0.1} A${r * 0.5} ${r * 0.5} 0 0 1 ${cx + r * 0.1} ${cy - r * 0.45}`, fill: 'none', stroke: '#a7dcf7', 'stroke-width': 6 }),
    ...bolts,
  ].join('');
}

/** The landmark: a tall lookout tower of stacked logs with portholes, a door and a shingled roof. */
function tower(): string {
  const { x, baseY, halfWidth } = TOWER;
  const left = (y: number) => x - halfWidth + 30 * ((baseY - y) / (baseY + 40));
  const right = (y: number) => x + halfWidth - 30 * ((baseY - y) / (baseY + 40));
  const bands: string[] = [];
  for (let y = baseY - 36; y > -40; y -= 38) bands.push(`M${left(y)} ${y} Q${x} ${y + 34} ${right(y)} ${y}`);
  const random = seeded(43);
  const shingles: string[] = [];
  for (let row = 0; row < 3; row++) {
    for (let sx = 116 + row * 18; sx < 424; sx += 36) {
      const sy = -46 + row * 26 + (random() - 0.5) * 3;
      shingles.push(`M${sx} ${sy} q18 22 36 0`);
    }
  }
  return inked([
    el('ellipse', { cx: x + 30, cy: baseY + 18, rx: halfWidth + 40, ry: 26, fill: 'rgba(42,29,23,0.25)', stroke: 'none' }),
    el('path', { d: towerBody(), fill: '#b97a45' }),
    group({ 'clip-path': 'url(#tower-clip)' }, [
      el('path', { d: bands.join(' '), fill: 'none', stroke: '#7a4a28', 'stroke-width': 4 }),
      el('path', { d: `M${x + 40} -60 L${x + halfWidth + 10} -60 L${x + halfWidth + 10} ${baseY + 60} L${x + 30} ${baseY + 60} Z`, fill: '#5e3418', opacity: 0.35, stroke: 'none' }),
      el('path', { d: `M${x - halfWidth + 34} -60 L${x - halfWidth + 54} -60 L${x - halfWidth + 22} ${baseY} L${x - halfWidth + 4} ${baseY} Z`, fill: '#f6cf98', opacity: 0.55, stroke: 'none' }),
    ]),
    el('path', { d: towerBody(), fill: 'none', 'stroke-width': 5 }),
    porthole(x - 10, 150, 38),
    porthole(x + 10, 345, 32),
    // Door with plank lines and a brass knob.
    el('path', { d: `M${x - 46} ${baseY + 14} V${baseY - 92} Q${x} ${baseY - 150} ${x + 46} ${baseY - 92} V${baseY + 18} Q${x} ${baseY + 28} ${x - 46} ${baseY + 14} Z`, fill: '#6b3f22' }),
    el('path', { d: `M${x - 15} ${baseY - 128} V${baseY + 22} M${x + 15} ${baseY - 128} V${baseY + 22}`, stroke: '#4a2a16', 'stroke-width': 3 }),
    el('circle', { cx: x + 30, cy: baseY - 36, r: 6, fill: '#f2c14e', 'stroke-width': 2.5 }),
    // Roof overhang, mostly cropped by the top of the screen.
    el('path', { d: 'M100 32 Q270 76 440 32 L404 -70 L136 -70 Z', fill: '#c4553e' }),
    el('path', { d: shingles.join(' '), fill: 'none', stroke: '#8f3326', 'stroke-width': 4 }),
    el('path', { d: 'M300 -70 L440 32 Q380 52 330 60 Z', fill: '#8f3326', opacity: 0.45, stroke: 'none' }),
    el('path', { d: 'M100 32 Q270 76 440 32', fill: 'none', 'stroke-width': 5 }),
  ]);
}

/** Small hand-placed touches: firewood, acorns, pinecones, a bucket, scattered leaves. */
function details(): string {
  const random = seeded(53);
  const firewood: string[] = [];
  [[0, 0], [30, 0], [60, 0], [15, -26], [45, -26], [30, -52]].forEach(([dx, dy]) => {
    const cx = 400 + (dx ?? 0);
    const cy = 600 + (dy ?? 0);
    firewood.push(el('circle', { cx, cy, r: 15, fill: '#f1c58c' }), el('circle', { cx, cy, r: 6, fill: 'none', stroke: '#c88a50', 'stroke-width': 2.5 }));
  });
  const acorn = (x: number, y: number) =>
    [el('ellipse', { cx: x, cy: y + 6, rx: 8, ry: 10, fill: '#c98a3f' }), el('path', { d: `M${x - 10} ${y + 1} Q${x} ${y - 10} ${x + 10} ${y + 1} Z`, fill: '#7a4a28' })].join('');
  const pinecone = (x: number, y: number) =>
    [el('ellipse', { cx: x, cy: y, rx: 11, ry: 16, fill: '#8a5530' }), el('path', { d: `M${x - 9} ${y - 5} l9 5 l9 -5 M${x - 10} ${y + 4} l10 5 l10 -5`, fill: 'none', stroke: '#5e3418', 'stroke-width': 2.5 })].join('');
  const leaves: string[] = [];
  for (let i = 0; i < 14; i++) {
    const x = 400 + random() * 1200;
    const y = 470 + random() * 420;
    leaves.push(el('ellipse', { cx: x, cy: y, rx: 10, ry: 5, fill: i % 3 ? '#79c257' : '#e9a23b', transform: `rotate(${random() * 180} ${x} ${y})`, 'stroke-width': 2.5 }));
  }
  return inked([
    ...firewood,
    acorn(1600, 600), acorn(1622, 610), acorn(1588, 620),
    pinecone(560, 900), pinecone(1660, 820),
    // A wooden bucket by the right lantern.
    el('path', { d: 'M1610 880 L1616 920 Q1636 930 1656 920 L1662 880 Z', fill: '#b97a45' }),
    el('ellipse', { cx: 1636, cy: 880, rx: 26, ry: 8, fill: '#57b9ea' }),
    el('path', { d: 'M1612 896 h48 M1614 912 h44', stroke: '#6b3f22', 'stroke-width': 3 }),
    ...leaves,
  ], 3.5);
}

export function renderDamBackdrop(): string {
  return svgDocument(
    defs() +
      group({ filter: 'url(#hand-drawn)' }, [
        sky(),
        distance(),
        pond(),
        river(),
        banks(),
        inked([pine(70, 330, 260), pine(1640, 420, 230), pine(1780, 360, 300), pine(1890, 470, 280), pine(1720, 600, 200)], 4.5),
        deck(),
        stickWall(),
        damFace(),
        tower(),
        details(),
        rocks(110, 1020, 1.3, 61),
        rocks(1800, 1030, 1.4, 67),
        rocks(1860, 820, 0.8, 71, 2),
      ]),
    `0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`,
  );
}

/** Where the scene animates water spilling over the dam. */
export const SPILLWAY = { x: 850, y: frontEdgeY(850) + 4, width: 220, height: FACE_DEPTH } as const;
export const POND_BAND = { top: 300, bottom: 390 } as const;
export const RIVER_BAND = { top: 1010, bottom: WORLD_HEIGHT } as const;
/** Open sky between the tower and the pines, where clouds may drift. */
export const SKY_LANE = { left: 470, right: 1480, top: 40, bottom: 170 } as const;
/** Canopy that sheds the odd falling leaf. */
export const LEAF_SOURCE = { left: 1600, right: 1900, top: 240, bottom: 420 } as const;
