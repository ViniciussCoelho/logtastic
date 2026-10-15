import { WORLD_HEIGHT, WORLD_WIDTH } from './damLayout';

/** Screens narrower than this (width / height) switch from "crop to fill" to a following camera. */
const NARROW_ASPECT = 1.2;
const MIN_VIEW_WIDTH = 400;

/**
 * How much of the room is shown at once. Wide screens see the whole room width and the
 * scaler crops a little top or bottom. On a portrait phone, cropping would hide most of the
 * room, so the view keeps the full room height at the screen's own shape, and the camera
 * follows the player's beaver sideways.
 */
export function viewWidthFor(screenWidth: number, screenHeight: number): number {
  if (screenWidth <= 0 || screenHeight <= 0) return WORLD_WIDTH;
  const aspect = screenWidth / screenHeight;
  if (aspect >= NARROW_ASPECT) return WORLD_WIDTH;
  return Math.max(MIN_VIEW_WIDTH, Math.round(WORLD_HEIGHT * aspect));
}
