import { describe, expect, it } from 'vitest';
import { BubbleQueue } from './bubbleQueue';

describe('BubbleQueue', () => {
  it('shows a balloon right away when nothing is up', () => {
    const queue = new BubbleQueue<string>(1500, 3);
    expect(queue.offer('hi', 0)).toBe('hi');
    expect(queue.offer('later', 5000)).toBe('later');
  });

  it('holds a quick follow-up until the current balloon has been readable long enough', () => {
    const queue = new BubbleQueue<string>(1500, 3);
    queue.offer('first', 0);
    expect(queue.offer('second', 400)).toBeNull();
    expect(queue.nextIn(400)).toBe(1100);
    expect(queue.take(1000)).toBeNull();
    expect(queue.take(1500)).toBe('second');
    expect(queue.nextIn(1500)).toBeNull();
  });

  it('keeps order, and spaces every waiting balloon by the minimum', () => {
    const queue = new BubbleQueue<string>(1500, 3);
    queue.offer('a', 0);
    queue.offer('b', 100);
    queue.offer('c', 200);
    expect(queue.take(1500)).toBe('b');
    expect(queue.take(2000)).toBeNull();
    expect(queue.take(3000)).toBe('c');
  });

  it('does not let a new balloon jump the line', () => {
    const queue = new BubbleQueue<string>(1500, 3);
    queue.offer('a', 0);
    queue.offer('b', 100);
    // Long after "a", but "b" is still waiting for its turn to be taken.
    expect(queue.offer('c', 4000)).toBeNull();
    expect(queue.take(4000)).toBe('b');
  });

  it('drops the oldest waiting balloons when spammed', () => {
    const queue = new BubbleQueue<number>(1500, 2);
    queue.offer(0, 0);
    [1, 2, 3, 4].forEach((n) => queue.offer(n, 10 * n));
    expect(queue.take(1500)).toBe(3);
    expect(queue.take(3000)).toBe(4);
  });
});
