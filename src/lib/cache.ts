// Crossref response cache backed by the CrossrefCache table (SQLite via Prisma).
import type { PrismaClient } from "@/generated/prisma/client";
import type { CacheStore, CachedResponse } from "./crossref";

export function createPrismaCache(db: PrismaClient): CacheStore {
  return {
    async get(key: string): Promise<CachedResponse | null> {
      const row = await db.crossrefCache.findUnique({ where: { key } });
      return row ? { status: row.status, body: JSON.parse(row.response) as unknown } : null;
    },
    async set(key: string, value: CachedResponse): Promise<void> {
      const data = { status: value.status, response: JSON.stringify(value.body), fetchedAt: new Date() };
      await db.crossrefCache.upsert({ where: { key }, create: { key, ...data }, update: data });
    },
  };
}
