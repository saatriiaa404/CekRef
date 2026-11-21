import { describe, expect, it } from "vitest";
import { createLimiter, parseRateLimit } from "@/lib/limiter";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createLimiter", () => {
  it("never runs more than maxConcurrency tasks at once", async () => {
    const limiter = createLimiter({ maxConcurrency: 3 });
    let active = 0;
    let peak = 0;
    const task = async () => {
      active++;
      peak = Math.max(peak, active);
      await tick();
      active--;
    };
    await Promise.all(Array.from({ length: 8 }, () => limiter.run(task)));
    expect(peak).toBe(3);
  });

  it("returns each task's result and propagates errors", async () => {
    const limiter = createLimiter({ maxConcurrency: 2 });
    await expect(limiter.run(async () => 42)).resolves.toBe(42);
    await expect(limiter.run(async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(limiter.run(async () => "still works")).resolves.toBe("still works");
  });

  it("spaces task starts by the minimum interval", async () => {
    let now = 1000;
    const waits: number[] = [];
    const limiter = createLimiter({
      maxConcurrency: 3,
      now: () => now,
      sleep: async (ms) => {
        waits.push(ms);
        now += ms;
      },
    });
    limiter.setMinInterval(200);
    await Promise.all([limiter.run(async () => {}), limiter.run(async () => {}), limiter.run(async () => {})]);
    expect(waits).toEqual([200, 200]);
  });
});

describe("parseRateLimit", () => {
  it("turns Crossref headers into a minimum interval between requests", () => {
    const headers = new Headers({ "x-rate-limit-limit": "50", "x-rate-limit-interval": "1s" });
    expect(parseRateLimit(headers)).toBe(20);
  });

  it("returns null when the headers are missing or invalid", () => {
    expect(parseRateLimit(new Headers())).toBeNull();
    expect(parseRateLimit(new Headers({ "x-rate-limit-limit": "0", "x-rate-limit-interval": "1s" }))).toBeNull();
    expect(parseRateLimit(new Headers({ "x-rate-limit-limit": "5", "x-rate-limit-interval": "soon" }))).toBeNull();
  });
});
