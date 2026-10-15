/**
 * Decides when a beaver's next balloon may appear. A balloon stays up for at least
 * `minShowMs` so a quick follow-up can't wipe it before anyone reads it; follow-ups wait in
 * line, and when too many pile up the oldest waiting ones are dropped.
 */
export class BubbleQueue<T> {
  private readonly waiting: T[] = [];
  private shownAt = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly minShowMs: number,
    private readonly maxWaiting: number,
  ) {}

  /** Returns the item if it can show right now; otherwise it waits in line and null is returned. */
  offer(item: T, now: number): T | null {
    if (this.waiting.length === 0 && now - this.shownAt >= this.minShowMs) {
      this.shownAt = now;
      return item;
    }
    this.waiting.push(item);
    if (this.waiting.length > this.maxWaiting) this.waiting.shift();
    return null;
  }

  /** Milliseconds until the next waiting item may show, or null when nothing is waiting. */
  nextIn(now: number): number | null {
    return this.waiting.length === 0 ? null : Math.max(0, this.shownAt + this.minShowMs - now);
  }

  /** The next waiting item, if its turn has come. */
  take(now: number): T | null {
    if (this.waiting.length === 0 || now - this.shownAt < this.minShowMs) return null;
    this.shownAt = now;
    return this.waiting.shift() ?? null;
  }
}
