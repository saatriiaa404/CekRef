import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { createPrismaCache } from "@/lib/cache";

// A throwaway SQLite file with the real migrations applied.
const dir = mkdtempSync(join(tmpdir(), "cekref-cache-"));
const db = new PrismaClient({ adapter: new PrismaLibSql({ url: `file:${join(dir, "test.db")}` }) });

beforeAll(async () => {
  const migrationsDir = join(__dirname, "../../prisma/migrations");
  for (const name of readdirSync(migrationsDir).filter((n) => !n.endsWith(".toml")).sort()) {
    const sql = readFileSync(join(migrationsDir, name, "migration.sql"), "utf8");
    for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await db.$executeRawUnsafe(statement);
    }
  }
});

afterAll(async () => {
  await db.$disconnect();
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    // Windows may keep the SQLite file locked until the process exits; the OS temp dir is cleaned later.
  }
});

describe("createPrismaCache", () => {
  const cache = createPrismaCache(db);

  it("returns null for an unknown key", async () => {
    expect(await cache.get("doi:10.1/unknown")).toBeNull();
  });

  it("stores and reads back a response body", async () => {
    await cache.set("doi:10.1/a", { status: 200, body: { title: ["Judul"], author: [{ family: "Hartono" }] } });
    expect(await cache.get("doi:10.1/a")).toEqual({
      status: 200,
      body: { title: ["Judul"], author: [{ family: "Hartono" }] },
    });
  });

  it("stores a 404 with a null body", async () => {
    await cache.set("doi:10.1/missing", { status: 404, body: null });
    expect(await cache.get("doi:10.1/missing")).toEqual({ status: 404, body: null });
  });

  it("overwrites an existing key", async () => {
    await cache.set("query:abc", { status: 200, body: { items: [] } });
    await cache.set("query:abc", { status: 200, body: { items: [{ DOI: "10.1/b" }] } });
    expect(await cache.get("query:abc")).toEqual({ status: 200, body: { items: [{ DOI: "10.1/b" }] } });
  });
});
