// Crossref client: DOI lookup and bibliographic search, with cache, retry, timeout,
// concurrency limit and DEMO_MODE (cache only, no network).
import { createHash } from "node:crypto";
import { config } from "../config";
import type { Author, Candidate } from "../engine/types";
import { createLimiter, parseRateLimit } from "./limiter";

// ---------- cache contract ----------

/** What we store per request: HTTP status and the Crossref `message` (null for 404). */
export interface CachedResponse {
  status: number;
  body: unknown;
}

export interface CacheStore {
  get(key: string): Promise<CachedResponse | null>;
  set(key: string, value: CachedResponse): Promise<void>;
}

export type LookupOutcome =
  | { kind: "ok"; candidates: Candidate[]; fromCache: boolean }
  | { kind: "not_found"; fromCache: boolean }
  | { kind: "unavailable"; reason: "demo" | "network" };

export interface CrossrefClient {
  getWorkByDoi(doi: string): Promise<LookupOutcome>;
  searchBibliographic(text: string): Promise<LookupOutcome>;
}

export interface CrossrefClientOptions {
  cache: CacheStore;
  mailto?: string;
  demoMode?: boolean;
  fetch?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  maxConcurrency?: number;
  retries?: number;
  retryBaseDelayMs?: number;
  rows?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

// ---------- Crossref JSON -> Candidate ----------

interface CrossrefDate {
  "date-parts"?: Array<Array<number | null>>;
}

interface CrossrefWork {
  DOI?: string;
  title?: string[];
  author?: Array<{ given?: string; family?: string; name?: string }>;
  issued?: CrossrefDate;
  "published-print"?: CrossrefDate;
  "published-online"?: CrossrefDate;
  published?: CrossrefDate;
  "container-title"?: string[];
}

function firstText(values: string[] | undefined): string | null {
  const text = values?.[0]?.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return text ? text : null;
}

function yearOf(work: CrossrefWork): number | null {
  for (const date of [work.issued, work["published-print"], work["published-online"], work.published]) {
    const year = date?.["date-parts"]?.[0]?.[0];
    if (typeof year === "number") return year;
  }
  return null;
}

/** Reduce a Crossref work to the fields CekRef compares. */
export function toCandidate(work: CrossrefWork): Candidate {
  const authors: Author[] = (work.author ?? [])
    .map((a) => ({ family: (a.family ?? a.name ?? "").trim(), given: a.given?.trim() || null }))
    .filter((a) => a.family !== "");
  return {
    doi: work.DOI ? work.DOI.toLowerCase() : null,
    title: firstText(work.title),
    authors,
    year: yearOf(work),
    venue: firstText(work["container-title"]),
  };
}

// ---------- client ----------

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createCrossrefClient(options: CrossrefClientOptions): CrossrefClient {
  const {
    cache,
    mailto = "",
    demoMode = false,
    fetch: fetchImpl = fetch,
    baseUrl = config.crossref.baseUrl,
    timeoutMs = config.crossref.timeoutMs,
    maxConcurrency = config.crossref.maxConcurrency,
    retries = config.crossref.retries,
    retryBaseDelayMs = config.crossref.retryBaseDelayMs,
    rows = config.crossref.rows,
    now = Date.now,
    sleep = defaultSleep,
  } = options;

  const limiter = createLimiter({ maxConcurrency, now, sleep });
  const headers: Record<string, string> = {
    "User-Agent": mailto ? `CekRef/0.1 (mailto:${mailto})` : "CekRef/0.1",
  };

  /** One HTTP attempt with a timeout. Returns null on network error or timeout. */
  async function attempt(url: string): Promise<Response | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetchImpl(url, { headers, signal: controller.signal });
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Fetch with retry + backoff; returns the final response, or null if every attempt failed. */
  async function fetchWithRetry(url: string): Promise<Response | null> {
    for (let i = 0; i <= retries; i++) {
      const response = await limiter.run(() => attempt(url));
      if (response) {
        const gap = parseRateLimit(response.headers);
        if (gap !== null) limiter.setMinInterval(gap);
        if (!RETRYABLE_STATUS.has(response.status)) return response;
      }
      if (i < retries) await sleep(retryBaseDelayMs * 2 ** i);
    }
    return null;
  }

  async function lookup(
    key: string,
    url: string,
    toCandidates: (body: unknown) => Candidate[],
  ): Promise<LookupOutcome> {
    const fromStore = (entry: CachedResponse, fromCache: boolean): LookupOutcome => {
      if (entry.status !== 200) return { kind: "not_found", fromCache };
      const candidates = toCandidates(entry.body);
      return candidates.length > 0 ? { kind: "ok", candidates, fromCache } : { kind: "not_found", fromCache };
    };

    const cached = await cache.get(key);
    if (cached) return fromStore(cached, true);
    if (demoMode) return { kind: "unavailable", reason: "demo" };

    const response = await fetchWithRetry(url);
    if (response === null) return { kind: "unavailable", reason: "network" };

    if (response.status === 200) {
      const payload = (await response.json()) as { message?: unknown };
      const entry = { status: 200, body: payload.message ?? null };
      await cache.set(key, entry);
      return fromStore(entry, false);
    }
    if (response.status === 404) {
      const entry = { status: 404, body: null };
      await cache.set(key, entry);
      return fromStore(entry, false);
    }
    // Other client errors (e.g. 400 for a malformed query): nothing to compare, not cached.
    return { kind: "not_found", fromCache: false };
  }

  const withMailto = (url: URL) => {
    if (mailto) url.searchParams.set("mailto", mailto);
    return url.toString();
  };

  return {
    getWorkByDoi(doi) {
      const normalized = doi.trim().toLowerCase();
      const url = withMailto(new URL(`${baseUrl}/works/${encodeURIComponent(normalized)}`));
      return lookup(`doi:${normalized}`, url, (body) => (body ? [toCandidate(body as CrossrefWork)] : []));
    },
    searchBibliographic(text) {
      const query = text.trim();
      const url = new URL(`${baseUrl}/works`);
      url.searchParams.set("query.bibliographic", query);
      url.searchParams.set("rows", String(rows));
      const hash = createHash("sha256").update(`${rows}|${query}`).digest("hex");
      return lookup(`query:${hash}`, withMailto(url), (body) =>
        ((body as { items?: CrossrefWork[] } | null)?.items ?? []).map(toCandidate),
      );
    },
  };
}
