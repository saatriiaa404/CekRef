// In-memory Crossref cache: used by tests, the fixture recorder, and demo seeding.
import type { CacheStore, CachedResponse } from "./crossref";

export interface MemoryCache extends CacheStore {
  toJSON(): Record<string, CachedResponse>;
}

export function createMemoryCache(initial: Record<string, CachedResponse> = {}): MemoryCache {
  const data = new Map(Object.entries(initial));
  return {
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => {
      data.set(key, value);
    },
    toJSON: () => Object.fromEntries(data),
  };
}
