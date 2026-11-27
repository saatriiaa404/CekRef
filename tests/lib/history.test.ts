import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { registerUser } from "@/lib/auth-core";
import {
  getUserHistoryById,
  listUserHistories,
  parseHistoryResults,
  saveCheckHistory,
  type StoredCheckResult,
} from "@/lib/history";

const dir = mkdtempSync(join(tmpdir(), "cekref-history-"));
const db = new PrismaClient({
  adapter: new PrismaLibSql({ url: `file:${join(dir, "test.db")}` }),
});

beforeAll(async () => {
  const migrationsDir = join(__dirname, "../../prisma/migrations");
  for (const name of readdirSync(migrationsDir)
    .filter((n) => !n.endsWith(".toml"))
    .sort()) {
    const sql = readFileSync(join(migrationsDir, name, "migration.sql"), "utf8");
    for (const statement of sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)) {
      await db.$executeRawUnsafe(statement);
    }
  }
});

afterAll(async () => {
  await db.$disconnect();
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    // Ignore Windows SQLite file lock on cleanup.
  }
});

const SAMPLE_RESULTS: StoredCheckResult[] = [
  {
    parsed: {
      raw: "J. Schmidhuber, 2015",
      style: "ieee",
      authors: [{ family: "Schmidhuber", given: "J." }],
      etAl: false,
      year: 2015,
      title: "Deep learning in neural networks: An overview",
      venue: "Neural Networks",
      doi: "10.1016/j.neunet.2014.09.003",
      url: null,
    },
    label: "match",
    score: 1,
    reasons: ["Semua data utama cocok dengan database."],
    best: {
      doi: "10.1016/j.neunet.2014.09.003",
      title: "Deep learning in neural networks: An overview",
      authors: [{ family: "Schmidhuber", given: "Jürgen" }],
      year: 2015,
      venue: "Neural Networks",
    },
    fields: [
      {
        field: "title",
        input: "Deep learning in neural networks: An overview",
        database: "Deep learning in neural networks: An overview",
        similarity: 1,
      },
    ],
    lookup: "doi",
    fromCache: true,
  },
  {
    parsed: {
      raw: "Unknown Paper (2024)",
      style: "apa",
      authors: [],
      etAl: false,
      year: 2024,
      title: "Unknown Paper",
      venue: null,
      doi: null,
      url: null,
    },
    label: "not_found",
    score: 0,
    reasons: ["Tidak ada kandidat yang ditemukan di Crossref. Periksa secara manual."],
    best: null,
    fields: [],
    lookup: "search",
    fromCache: false,
  },
];

describe("check history persistence", () => {
  it("saves, summarizes, and isolates check history per user", async () => {
    const a = await registerUser(db, "a@kampus.ac.id", "password88");
    const b = await registerUser(db, "b@kampus.ac.id", "password88");
    if (!a.ok || !b.ok) throw new Error("Setup users failed");

    const id = await saveCheckHistory(db, a.user.id, SAMPLE_RESULTS);

    const listA = await listUserHistories(db, a.user.id);
    expect(listA).toHaveLength(1);
    expect(listA[0].entryCount).toBe(2);
    expect(listA[0].counts).toEqual({ match: 1, partial: 0, notFound: 1 });

    const listB = await listUserHistories(db, b.user.id);
    expect(listB).toHaveLength(0);

    const detailA = await getUserHistoryById(db, a.user.id, id);
    expect(detailA?.results).toHaveLength(2);

    const detailB = await getUserHistoryById(db, b.user.id, id);
    expect(detailB).toBeNull();
  });

  it("handles malformed JSON safely", () => {
    expect(parseHistoryResults("not-json")).toEqual([]);
    expect(parseHistoryResults("{}")).toEqual([]);
  });
});
