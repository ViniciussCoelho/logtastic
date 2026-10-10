import { describe, expect, it } from 'vitest';
import { createThrottle } from './throttle';

describe('createThrottle', () => {
  it('lets one action through per interval', () => {
    let now = 1000;
    const allow = createThrottle(800, () => now);
    expect(allow()).toBe(true);
    now += 799;
    expect(allow()).toBe(false);
    now += 1;
    expect(allow()).toBe(true);
  });
});
