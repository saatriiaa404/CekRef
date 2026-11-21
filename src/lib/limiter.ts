// Small hand-written request limiter: caps concurrent tasks and spaces their start times.
// Used by the Crossref client to stay within the polite-pool limits.

export interface LimiterOptions {
  maxConcurrency: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export interface Limiter {
  run<T>(task: () => Promise<T>): Promise<T>;
  /** Minimum milliseconds between two task starts (0 = no spacing). */
  setMinInterval(ms: number): void;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createLimiter({ maxConcurrency, now = Date.now, sleep = defaultSleep }: LimiterOptions): Limiter {
  let active = 0;
  const waiting: Array<() => void> = [];
  let minInterval = 0;
  let lastStartAt = Number.NEGATIVE_INFINITY;
  let startGate: Promise<void> = Promise.resolve();

  async function acquireSlot(): Promise<void> {
    if (active < maxConcurrency) {
      active++;
    } else {
      // The releasing task hands its slot over directly, so `active` stays the same.
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
  }

  function releaseSlot(): void {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }

  /**
   * Starts are serialized through a gate so each one waits until the previous start + interval.
   * The interval is read at wait time, so a limit learned from a response applies to the next start.
   */
  async function waitForStartTurn(): Promise<void> {
    const turn = startGate.then(async () => {
      const wait = lastStartAt + minInterval - now();
      if (wait > 0) await sleep(wait);
      lastStartAt = now();
    });
    startGate = turn.catch(() => undefined);
    await turn;
  }

  return {
    async run<T>(task: () => Promise<T>): Promise<T> {
      await acquireSlot();
      try {
        await waitForStartTurn();
        return await task();
      } finally {
        releaseSlot();
      }
    },
    setMinInterval(ms: number) {
      minInterval = Math.max(0, ms);
    },
  };
}

const INTERVAL_RE = /^(\d+(?:\.\d+)?)(ms|s|m)?$/;
const UNIT_MS: Record<string, number> = { ms: 1, s: 1000, m: 60_000 };

/**
 * Crossref sends e.g. `x-rate-limit-limit: 50` and `x-rate-limit-interval: 1s`.
 * Returns the minimum gap between requests in ms, or null if the headers are absent/invalid.
 */
export function parseRateLimit(headers: Headers): number | null {
  const limit = Number(headers.get("x-rate-limit-limit"));
  const interval = headers.get("x-rate-limit-interval")?.trim().match(INTERVAL_RE);
  if (!Number.isFinite(limit) || limit <= 0 || !interval) return null;
  const intervalMs = Number(interval[1]) * UNIT_MS[interval[2] ?? "s"];
  return intervalMs / limit;
}
