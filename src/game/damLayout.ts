import type { Vec2 } from '../types/geometry';

/**
 * Geometry of The Dam in world pixels. Positions are where a beaver's feet touch the deck.
 * Shared by the scene (drawing, collision) and the mock server (where bots may walk).
 */

export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1080;

/** Radius of a beaver's footprint, used to keep them off props. */
export const BEAVER_RADIUS = 20;

export interface Obstacle {
  x: number;
  y: number;
  radius: number;
}

export interface RoomLayout {
  /** The walkable part of the deck, as a polygon. */
  walkable: readonly Vec2[];
  obstacles: readonly Obstacle[];
  spawn: Vec2;
}

/**
 * Outline of the dam-top platform as painted: a lumpy, organic shape that is narrow at the
 * back and wide at the front, seen from a high three-quarter angle. Clockwise from back-left.
 */
export const FLOOR_OUTLINE: readonly Vec2[] = [
  { x: 430, y: 432 },
  { x: 700, y: 404 },
  { x: 960, y: 396 },
  { x: 1240, y: 404 },
  { x: 1530, y: 432 },
  { x: 1700, y: 556 },
  { x: 1800, y: 720 },
  { x: 1760, y: 862 },
  { x: 1400, y: 930 },
  { x: 960, y: 950 },
  { x: 520, y: 930 },
  { x: 180, y: 862 },
  { x: 136, y: 716 },
  { x: 290, y: 566 },
];

/** The log lookout tower: the room's landmark, standing on the back-left of the deck. */
export const TOWER = { x: 270, baseY: 590, halfWidth: 132 } as const;

export const DAM_PROPS = {
  sign: { x: 1170, y: 432 },
  backLanterns: [
    { x: 720, y: 428 },
    { x: 1510, y: 452 },
  ],
  frontLanterns: [
    { x: 390, y: 888 },
    { x: 1560, y: 886 },
  ],
  stumpTable: { x: 720, y: 660 },
  logBench: { x: 1250, y: 728 },
} as const;

export const DAM_LAYOUT: RoomLayout = {
  walkable: [
    { x: 480, y: 466 },
    { x: 960, y: 440 },
    { x: 1470, y: 470 },
    { x: 1650, y: 584 },
    { x: 1730, y: 722 },
    { x: 1690, y: 832 },
    { x: 1380, y: 884 },
    { x: 960, y: 900 },
    { x: 540, y: 884 },
    { x: 236, y: 830 },
    { x: 214, y: 720 },
    { x: 360, y: 608 },
  ],
  obstacles: [
    { x: TOWER.x, y: TOWER.baseY - 30, radius: 120 },
    { ...DAM_PROPS.sign, radius: 30 },
    ...DAM_PROPS.backLanterns.map((p) => ({ ...p, radius: 16 })),
    ...DAM_PROPS.frontLanterns.map((p) => ({ ...p, radius: 16 })),
    { ...DAM_PROPS.stumpTable, radius: 62 },
    { x: DAM_PROPS.logBench.x - 52, y: DAM_PROPS.logBench.y, radius: 30 },
    { x: DAM_PROPS.logBench.x, y: DAM_PROPS.logBench.y, radius: 30 },
    { x: DAM_PROPS.logBench.x + 52, y: DAM_PROPS.logBench.y, radius: 30 },
  ],
  spawn: { x: 960, y: 660 },
};
