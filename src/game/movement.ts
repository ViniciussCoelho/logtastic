import type { Direction } from '../features/character/avatar/pose';
import type { Vec2 } from '../types/geometry';
import { BEAVER_RADIUS, type RoomLayout } from './damLayout';

const distance = (a: Vec2, b: Vec2): number => Math.hypot(b.x - a.x, b.y - a.y);

export function isInsidePolygon(point: Vec2, polygon: readonly Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!;
    const b = polygon[j]!;
    const crosses = a.y > point.y !== b.y > point.y;
    if (crosses && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function isWalkable(point: Vec2, layout: RoomLayout): boolean {
  return (
    isInsidePolygon(point, layout.walkable) &&
    layout.obstacles.every((obstacle) => distance(point, obstacle) >= obstacle.radius + BEAVER_RADIUS)
  );
}

function closestPointOnSegment(point: Vec2, a: Vec2, b: Vec2): Vec2 {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
  return { x: a.x + t * dx, y: a.y + t * dy };
}

function closestPointOnPolygon(point: Vec2, polygon: readonly Vec2[]): Vec2 {
  let best = polygon[0]!;
  let bestDistance = Infinity;
  polygon.forEach((a, i) => {
    const candidate = closestPointOnSegment(point, a, polygon[(i + 1) % polygon.length]!);
    const d = distance(point, candidate);
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  });
  return best;
}

function centroid(polygon: readonly Vec2[]): Vec2 {
  const sum = polygon.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / polygon.length, y: sum.y / polygon.length };
}

function moveTowards(from: Vec2, to: Vec2, amount: number): Vec2 {
  const d = distance(from, to);
  if (d === 0) return from;
  return { x: from.x + ((to.x - from.x) / d) * amount, y: from.y + ((to.y - from.y) / d) * amount };
}

/** The nearest spot a beaver can stand on, so clicks on water or props still lead somewhere sensible. */
export function clampToWalkable(point: Vec2, layout: RoomLayout): Vec2 {
  let result = point;
  for (let attempt = 0; attempt < 4 && !isWalkable(result, layout); attempt++) {
    if (!isInsidePolygon(result, layout.walkable)) {
      const edge = closestPointOnPolygon(result, layout.walkable);
      result = moveTowards(edge, centroid(layout.walkable), 2);
    }
    const blocking = layout.obstacles.find((o) => distance(result, o) < o.radius + BEAVER_RADIUS);
    if (blocking) {
      const away = distance(result, blocking) === 0 ? { x: blocking.x, y: blocking.y + 1 } : result;
      result = moveTowards(blocking, away, blocking.radius + BEAVER_RADIUS + 1);
    }
  }
  return isWalkable(result, layout) ? result : layout.spawn;
}

export interface Step {
  position: Vec2;
  arrived: boolean;
}

const DETOUR_ANGLES = [0.5, 1, 1.4];

function rotate(v: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

/**
 * Advances one frame towards the target. When the straight line is blocked it tries a few
 * angled detours (sliding around round props and along edges); if all fail, the beaver stops.
 */
export function stepTowards(from: Vec2, target: Vec2, maxDistance: number, layout: RoomLayout): Step {
  const remaining = distance(from, target);
  if (remaining <= maxDistance) {
    return isWalkable(target, layout) ? { position: target, arrived: true } : { position: from, arrived: true };
  }

  const heading = { x: (target.x - from.x) / remaining, y: (target.y - from.y) / remaining };
  const straight = { x: from.x + heading.x * maxDistance, y: from.y + heading.y * maxDistance };
  if (isWalkable(straight, layout)) return { position: straight, arrived: false };

  for (const angle of DETOUR_ANGLES) {
    const options = [angle, -angle]
      .map((a) => rotate(heading, a))
      .map((dir) => ({ x: from.x + dir.x * maxDistance, y: from.y + dir.y * maxDistance }))
      .filter((candidate) => isWalkable(candidate, layout))
      .sort((a, b) => distance(a, target) - distance(b, target));
    if (options[0]) return { position: options[0], arrived: false };
  }
  return { position: from, arrived: true };
}

/** Which way a beaver faces when moving by (dx, dy). Down the screen is towards the viewer. */
export function facingFor(dx: number, dy: number, current: Direction): Direction {
  if (dx === 0 && dy === 0) return current;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'back' : 'front';
}

/** A random standing spot on the deck. */
export function randomWalkablePoint(layout: RoomLayout, random: () => number = Math.random): Vec2 {
  const xs = layout.walkable.map((p) => p.x);
  const ys = layout.walkable.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (let attempt = 0; attempt < 50; attempt++) {
    const point = { x: Math.round(minX + random() * (maxX - minX)), y: Math.round(minY + random() * (maxY - minY)) };
    if (isWalkable(point, layout)) return point;
  }
  return layout.spawn;
}
