import { describe, expect, it } from 'vitest';
import { WORLD_WIDTH } from './damLayout';
import { viewWidthFor } from './viewport';

describe('viewWidthFor', () => {
  it('shows the whole room width on desktop and landscape screens', () => {
    expect(viewWidthFor(1440, 900)).toBe(WORLD_WIDTH);
    expect(viewWidthFor(844, 390)).toBe(WORLD_WIDTH);
  });

  it('keeps the full room height at the screen shape on portrait phones', () => {
    expect(viewWidthFor(390, 844)).toBe(499);
    expect(viewWidthFor(768, 1024)).toBe(810);
  });

  it('never gets absurdly narrow, and survives a not-yet-laid-out parent', () => {
    expect(viewWidthFor(200, 1000)).toBe(400);
    expect(viewWidthFor(0, 0)).toBe(WORLD_WIDTH);
  });
});
