import { describe, expect, it } from 'vitest';
import { FACES, FUR_COLORS, HATS, describeAppearance, isAvatarAppearance, type AvatarAppearance } from './appearance';
import { DIRECTIONS, IDLE_POSE } from './avatar/pose';
import { renderAvatarLayers } from './avatar/renderAvatar';

const look = (overrides: Partial<AvatarAppearance> = {}): AvatarAppearance => ({
  fur: 'cream',
  face: 'dots',
  hat: 'none',
  ...overrides,
});

describe('appearance catalogue', () => {
  it('offers the five fur colors, five faces and five hat options', () => {
    expect(FUR_COLORS.map((fur) => fur.label)).toEqual([
      'Classic Brown',
      'Dark Chocolate',
      'Golden Brown',
      'Ash Gray',
      'Cream',
    ]);
    expect(FACES.map((face) => face.label)).toEqual(['Dots', 'Sparkly', 'Happy', 'Cool', 'Wink']);
    expect(HATS.map((hat) => hat.label)).toEqual(['No hat', 'Baseball cap', 'Beanie', 'Straw hat', 'Explorer hat']);
  });

  it('validates untrusted appearance payloads by stable id', () => {
    expect(isAvatarAppearance({ fur: 'ash-gray', face: 'wink', hat: 'beanie' })).toBe(true);
    expect(isAvatarAppearance({ fur: 'Ash Gray', face: 'wink', hat: 'beanie' })).toBe(false);
    expect(isAvatarAppearance({ fur: 'cream', face: 'angry', hat: 'none' })).toBe(false);
    expect(isAvatarAppearance({ fur: 'cream', hat: 'none' })).toBe(false);
    expect(isAvatarAppearance({ fur: 'cream', face: 'dots', hat: 'crown' })).toBe(false);
    expect(isAvatarAppearance(null)).toBe(false);
  });

  it('describes an outfit in words for screen readers', () => {
    expect(describeAppearance({ fur: 'cream', face: 'happy', hat: 'straw-hat' })).toBe('Cream fur, happy face, straw hat');
    expect(describeAppearance({ fur: 'golden-brown', face: 'dots', hat: 'none' })).toBe('Golden Brown fur, dots face, no hat');
  });
});

describe('avatar layers', () => {
  it('paints the body with the chosen fur palette', () => {
    for (const fur of FUR_COLORS) {
      const { body } = renderAvatarLayers(look({ fur: fur.id }), IDLE_POSE);
      expect(body).toContain(fur.palette.base);
      expect(body).toContain(fur.palette.light);
    }
  });

  it('draws a different face for every face option', () => {
    const bodies = FACES.map((face) => renderAvatarLayers(look({ face: face.id }), IDLE_POSE).body);
    expect(new Set(bodies).size).toBe(FACES.length);
  });

  it('keeps the hat as an independent layer that does not depend on fur or face', () => {
    const brown = renderAvatarLayers(look({ fur: 'classic-brown', hat: 'beanie' }), IDLE_POSE);
    const gray = renderAvatarLayers(look({ fur: 'ash-gray', face: 'cool', hat: 'beanie' }), IDLE_POSE);
    expect(brown.hat).not.toBeNull();
    expect(brown.hat).toBe(gray.hat);
    expect(brown.body).not.toBe(gray.body);
  });

  it('renders no hat layer for "No hat"', () => {
    expect(renderAvatarLayers(look(), IDLE_POSE).hat).toBeNull();
  });

  it('renders every hat in all four directions on the shared canvas', () => {
    for (const hat of HATS.filter((option) => option.id !== 'none')) {
      for (const direction of DIRECTIONS) {
        const layers = renderAvatarLayers(look({ hat: hat.id }), { direction, step: 0, blink: false });
        expect(layers.hat).toContain('viewBox="0 0 120 150"');
        expect(layers.body).toContain('viewBox="0 0 120 150"');
      }
    }
  });

  it('draws the right-facing beaver as a mirror of the left-facing one', () => {
    const appearance = look({ hat: 'baseball-cap' });
    const left = renderAvatarLayers(appearance, { direction: 'left', step: 0, blink: false });
    const right = renderAvatarLayers(appearance, { direction: 'right', step: 0, blink: false });
    expect(right.body).toContain('matrix(-1 0 0 1 120 0)');
    expect(right.hat).toContain('matrix(-1 0 0 1 120 0)');
    expect(left.body).not.toContain('matrix(-1');
  });

  it('gives walk steps a different frame than standing', () => {
    const appearance = look({ hat: 'beanie' });
    const standing = renderAvatarLayers(appearance, { direction: 'front', step: 0, blink: false });
    const striding = renderAvatarLayers(appearance, { direction: 'front', step: 1, blink: false });
    expect(striding.body).not.toBe(standing.body);
    expect(striding.hat).not.toBe(standing.hat);
  });
});
