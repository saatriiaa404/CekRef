import { describe, expect, it } from "vitest";
import { createCrossrefClient, toCandidate, type CacheStore, type CachedResponse } from "@/lib/crossref";

// Minimal Crossref-shaped message (fields we read only).
const WORK = {
  DOI: "10.1016/J.NEUNET.2014.09.003",
  title: ["Deep learning in neural networks: <i>An overview</i>"],
  author: [{ given: "Jürgen", family: "Schmidhuber" }],
  issued: { "date-parts": [[2015, 1]] },
  "container-title": ["Neural Networks"],
};

function memoryCache(initial: Record<string, CachedResponse> = {}): CacheStore & { data: Map<string, CachedResponse> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => {
      data.set(key, value);
    },
  };
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

/** fetch stub that replays the given responses in order and records requested URLs. */
function fakeFetch(...responses: Array<Response | Error>) {
  const urls: string[] = [];
  const fn = async (input: RequestInfo | URL) => {
    urls.push(String(input));
    const next = responses.shift();
    if (!next) throw new Error("unexpected fetch");
    if (next instanceof Error) throw next;
    return next;
  };
  return Object.assign(fn as typeof fetch, { urls });
}

const noSleep = async () => {};

function client(fetchImpl: typeof fetch, cache = memoryCache(), extra: Partial<Parameters<typeof createCrossrefClient>[0]> = {}) {
  return createCrossrefClient({ fetch: fetchImpl, cache, mailto: "tim@contoh.ac.id", sleep: noSleep, ...extra });
}

describe("toCandidate", () => {
  it("maps a Crossref work to the fields we compare", () => {
    expect(toCandidate(WORK)).toEqual({
      doi: "10.1016/j.neunet.2014.09.003",
      title: "Deep learning in neural networks: An overview",
      authors: [{ family: "Schmidhuber", given: "Jürgen" }],
      year: 2015,
      venue: "Neural Networks",
    });
  });

  it("uses an organization name as the family name and tolerates missing fields", () => {
    expect(toCandidate({ author: [{ name: "World Health Organization" }] })).toEqual({
      doi: null,
      title: null,
      authors: [{ family: "World Health Organization", given: null }],
      year: null,
      venue: null,
    });
  });

  it("falls back to the print or online publication year", () => {
    expect(toCandidate({ "published-print": { "date-parts": [[2019]] } }).year).toBe(2019);
    expect(toCandidate({ "published-online": { "date-parts": [[2018, 5]] } }).year).toBe(2018);
  });
});

describe("getWorkByDoi", () => {
  it("requests /works/{doi} with mailto and returns one candidate", async () => {
    const fetchImpl = fakeFetch(json(200, { message: WORK }));
    const result = await client(fetchImpl).getWorkByDoi("10.1016/j.neunet.2014.09.003");
    expect(fetchImpl.urls[0]).toBe(
      "https://api.crossref.org/works/10.1016%2Fj.neunet.2014.09.003?mailto=tim%40contoh.ac.id",
    );
    expect(result).toEqual({ kind: "ok", fromCache: false, candidates: [toCandidate(WORK)] });
  });

  it("serves the second lookup from the cache without calling Crossref", async () => {
    const cache = memoryCache();
    const fetchImpl = fakeFetch(json(200, { message: WORK }));
    const crossref = client(fetchImpl, cache);
    await crossref.getWorkByDoi("10.1016/j.neunet.2014.09.003");
    const second = await crossref.getWorkByDoi("10.1016/j.neunet.2014.09.003");
    expect(fetchImpl.urls).toHaveLength(1);
    expect(second).toMatchObject({ kind: "ok", fromCache: true });
  });

  it("returns not_found for an unknown DOI and caches that answer", async () => {
    const cache = memoryCache();
    const fetchImpl = fakeFetch(new Response("Resource not found.", { status: 404 }));
    const crossref = client(fetchImpl, cache);
    expect(await crossref.getWorkByDoi("10.9999/nope")).toEqual({ kind: "not_found", fromCache: false });
    expect(await crossref.getWorkByDoi("10.9999/nope")).toEqual({ kind: "not_found", fromCache: true });
    expect(fetchImpl.urls).toHaveLength(1);
  });

  it("retries once after a server error", async () => {
    const fetchImpl = fakeFetch(json(503, {}), json(200, { message: WORK }));
    const result = await client(fetchImpl).getWorkByDoi("10.1016/j.neunet.2014.09.003");
    expect(result.kind).toBe("ok");
    expect(fetchImpl.urls).toHaveLength(2);
  });

  it("reports the network as unavailable after the retry also fails, without caching", async () => {
    const cache = memoryCache();
    const fetchImpl = fakeFetch(new Error("ECONNRESET"), json(500, {}));
    const result = await client(fetchImpl, cache).getWorkByDoi("10.1016/j.neunet.2014.09.003");
    expect(result).toEqual({ kind: "unavailable", reason: "network" });
    expect(cache.data.size).toBe(0);
  });

  it("aborts a request that exceeds the timeout", async () => {
    let calls = 0;
    const hanging = ((_: RequestInfo | URL, init?: RequestInit) => {
      calls++;
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    }) as typeof fetch;
    const result = await client(hanging, memoryCache(), { timeoutMs: 5 }).getWorkByDoi("10.1/slow");
    expect(result).toEqual({ kind: "unavailable", reason: "network" });
    expect(calls).toBe(2);
  });
});

describe("searchBibliographic", () => {
  it("requests query.bibliographic with 5 rows and maps every item", async () => {
    const fetchImpl = fakeFetch(json(200, { message: { items: [WORK, { ...WORK, DOI: "10.1/other" }] } }));
    const result = await client(fetchImpl).searchBibliographic("Schmidhuber deep learning overview");
    const url = new URL(fetchImpl.urls[0]);
    expect(url.pathname).toBe("/works");
    expect(url.searchParams.get("query.bibliographic")).toBe("Schmidhuber deep learning overview");
    expect(url.searchParams.get("rows")).toBe("5");
    expect(result.kind === "ok" && result.candidates.map((c) => c.doi)).toEqual([
      "10.1016/j.neunet.2014.09.003",
      "10.1/other",
    ]);
  });

  it("caches searches under a hashed key", async () => {
    const cache = memoryCache();
    await client(fakeFetch(json(200, { message: { items: [WORK] } })), cache).searchBibliographic("some query");
    const [key] = [...cache.data.keys()];
    expect(key).toMatch(/^query:[0-9a-f]{64}$/);
  });

  it("returns not_found when the search has no items", async () => {
    const result = await client(fakeFetch(json(200, { message: { items: [] } }))).searchBibliographic("x");
    expect(result).toEqual({ kind: "not_found", fromCache: false });
  });
});

describe("DEMO_MODE", () => {
  it("never calls Crossref and reports cache misses as unavailable", async () => {
    const fetchImpl = fakeFetch();
    const result = await client(fetchImpl, memoryCache(), { demoMode: true }).getWorkByDoi("10.1/x");
    expect(result).toEqual({ kind: "unavailable", reason: "demo" });
    expect(fetchImpl.urls).toHaveLength(0);
  });

  it("still answers from the cache", async () => {
    const cache = memoryCache();
    await client(fakeFetch(json(200, { message: WORK })), cache).getWorkByDoi("10.1/x");
    const result = await client(fakeFetch(), cache, { demoMode: true }).getWorkByDoi("10.1/x");
    expect(result).toMatchObject({ kind: "ok", fromCache: true });
  });
});

describe("politeness", () => {
  it("never has more than 3 requests in flight", async () => {
    let active = 0;
    let peak = 0;
    const slow = (async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return json(200, { message: WORK });
    }) as typeof fetch;
    const crossref = client(slow);
    await Promise.all(Array.from({ length: 7 }, (_, i) => crossref.getWorkByDoi(`10.1/${i}`)));
    expect(peak).toBe(3);
  });

  it("slows down according to x-rate-limit headers", async () => {
    const waits: number[] = [];
    let now = 0;
    const fetchImpl = fakeFetch(
      json(200, { message: WORK }, { "x-rate-limit-limit": "2", "x-rate-limit-interval": "1s" }),
      json(200, { message: WORK }),
    );
    const crossref = client(fetchImpl, memoryCache(), {
      now: () => now,
      sleep: async (ms) => {
        waits.push(ms);
        now += ms;
      },
    });
    await crossref.getWorkByDoi("10.1/a");
    await crossref.getWorkByDoi("10.1/b");
    expect(waits).toEqual([500]);
  });
});
