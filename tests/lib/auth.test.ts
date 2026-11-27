import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import {
  authenticateUser,
  createSessionRecord,
  deleteSessionByToken,
  getUserBySessionToken,
  hashPassword,
  registerUser,
  verifyPassword,
} from "@/lib/auth-core";
import { buildSessionCookieOptions } from "@/lib/session";

const dir = mkdtempSync(join(tmpdir(), "cekref-auth-"));
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
    // Windows may keep SQLite locked briefly; temp dir is cleaned by OS.
  }
});

describe("password hashing", () => {
  it("hashes password with bcrypt and verifies matching password", async () => {
    const hash = await hashPassword("rahasia123");
    expect(hash).not.toBe("rahasia123");
    expect(hash.startsWith("$2")).toBe(true);
    expect(await verifyPassword("rahasia123", hash)).toBe(true);
    expect(await verifyPassword("salah1234", hash)).toBe(false);
  });
});

describe("registration and login", () => {
  it("registers user with normalized email and rejects duplicates", async () => {
    const res1 = await registerUser(db, " Mahasiswa@Kampus.ac.id ", "password88");
    expect(res1.ok).toBe(true);
    if (res1.ok) {
      expect(res1.user.email).toBe("mahasiswa@kampus.ac.id");
      expect(res1.user.role).toBe("user");
    }

    const res2 = await registerUser(db, "mahasiswa@kampus.ac.id", "password99");
    expect(res2).toEqual({ ok: false, reason: "duplicate_email" });
  });

  it("authenticates valid credentials and rejects wrong email or password", async () => {
    const valid = await authenticateUser(db, "MAHASISWA@kampus.ac.id", "password88");
    expect(valid?.email).toBe("mahasiswa@kampus.ac.id");

    const wrongPass = await authenticateUser(db, "mahasiswa@kampus.ac.id", "bukanini");
    expect(wrongPass).toBeNull();

    const unknownEmail = await authenticateUser(db, "tidakada@kampus.ac.id", "password88");
    expect(unknownEmail).toBeNull();
  });
});

describe("session validation and cookie options", () => {
  it("creates, resolves, expires, and deletes sessions", async () => {
    const user = await authenticateUser(db, "mahasiswa@kampus.ac.id", "password88");
    expect(user).not.toBeNull();

    const { token, expiresAt } = await createSessionRecord(db, user!.id, 7);
    expect(token.length).toBeGreaterThanOrEqual(32);

    const active = await getUserBySessionToken(db, token);
    expect(active?.email).toBe("mahasiswa@kampus.ac.id");

    const invalid = await getUserBySessionToken(db, "token-palsu-tidak-ada");
    expect(invalid).toBeNull();

    const expired = await getUserBySessionToken(
      db,
      token,
      new Date(expiresAt.getTime() + 1000),
    );
    expect(expired).toBeNull();

    const second = await createSessionRecord(db, user!.id, 7);
    expect(await getUserBySessionToken(db, second.token)).not.toBeNull();
    await deleteSessionByToken(db, second.token);
    expect(await getUserBySessionToken(db, second.token)).toBeNull();
  });

  it("builds httpOnly and sameSite cookie options", () => {
    const expiresAt = new Date(Date.now() + 60_000);
    const options = buildSessionCookieOptions(expiresAt);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.expires).toEqual(expiresAt);
  });
});
