import { describe, expect, it } from 'vitest';
import type { Vec2 } from '../types/geometry';
import { DAM_LAYOUT, DAM_PROPS } from './damLayout';
import { clampToWalkable, facingFor, isWalkable, randomWalkablePoint, stepTowards } from './movement';

describe('walkable area', () => {
  it('starts the player on the deck', () => {
    expect(isWalkable(DAM_LAYOUT.spawn, DAM_LAYOUT)).toBe(true);
  });

  it('treats water, banks and props as off limits', () => {
    expect(isWalkable({ x: 960, y: 420 }, DAM_LAYOUT)).toBe(false); // the pond
    expect(isWalkable({ x: 960, y: 1000 }, DAM_LAYOUT)).toBe(false); // the river
    expect(isWalkable(DAM_PROPS.stumpTable, DAM_LAYOUT)).toBe(false);
  });

  it('turns a click on the water or a prop into the nearest spot on the deck', () => {
    const fromPond = clampToWalkable({ x: 960, y: 300 }, DAM_LAYOUT);
    expect(isWalkable(fromPond, DAM_LAYOUT)).toBe(true);
    expect(fromPond.y).toBeLessThan(560);

    const fromTable = clampToWalkable(DAM_PROPS.stumpTable, DAM_LAYOUT);
    expect(isWalkable(fromTable, DAM_LAYOUT)).toBe(true);
  });

  it('picks random spots that are always walkable', () => {
    let seed = 1;
    const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 50; i++) expect(isWalkable(randomWalkablePoint(DAM_LAYOUT, random), DAM_LAYOUT)).toBe(true);
  });
});

describe('stepTowards', () => {
  it('moves at most the given distance and arrives exactly on the target', () => {
    const start = { x: 900, y: 600 };
    const first = stepTowards(start, { x: 1000, y: 600 }, 40, DAM_LAYOUT);
    expect(first).toEqual({ position: { x: 940, y: 600 }, arrived: false });

    const last = stepTowards({ x: 990, y: 600 }, { x: 1000, y: 600 }, 40, DAM_LAYOUT);
    expect(last).toEqual({ position: { x: 1000, y: 600 }, arrived: true });
  });

  it('walks around a prop instead of through it', () => {
    const { x, y } = DAM_PROPS.stumpTable;
    let position: Vec2 = { x: x - 140, y };
    const target = { x: x + 140, y };
    for (let frame = 0; frame < 200; frame++) {
      const step = stepTowards(position, target, 8, DAM_LAYOUT);
      expect(isWalkable(step.position, DAM_LAYOUT)).toBe(true);
      position = step.position;
      if (step.arrived) break;
    }
    expect(position).toEqual(target);
  });
});

describe('facingFor', () => {
  it('faces the dominant direction of travel, towards the viewer when moving down', () => {
    expect(facingFor(-5, 1, 'front')).toBe('left');
    expect(facingFor(5, -1, 'front')).toBe('right');
    expect(facingFor(1, 5, 'back')).toBe('front');
    expect(facingFor(1, -5, 'front')).toBe('back');
    expect(facingFor(0, 0, 'left')).toBe('left');
  });
});
