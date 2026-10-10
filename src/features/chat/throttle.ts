/** Lets an action through at most once per `intervalMs`; protects the room from spam. */
export function createThrottle(intervalMs: number, now: () => number = Date.now) {
  let last = -Infinity;
  return (): boolean => {
    const time = now();
    if (time - last < intervalMs) return false;
    last = time;
    return true;
  };
}
