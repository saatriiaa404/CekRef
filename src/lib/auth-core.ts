import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@/generated/prisma/client";
import { normalizeEmail } from "./validation";

const BCRYPT_ROUNDS = 10;
export const SESSION_TTL_DAYS = 7;

export interface SafeUser {
  id: string;
  email: string;
  role: string;
}

/** Hashes a plain-text password using bcrypt. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verifies a plain-text password against a stored bcrypt hash. */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/** Generates a cryptographically random opaque session token. */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Hashes a session token with SHA-256 before storing or querying in the database. */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type RegisterOutcome =
  | { ok: true; user: SafeUser }
  | { ok: false; reason: "duplicate_email" };

/** Creates a new user storing only normalized email and bcrypt password hash. */
export async function registerUser(
  prisma: PrismaClient,
  rawEmail: string,
  password: string,
): Promise<RegisterOutcome> {
  const email = normalizeEmail(rawEmail);
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, reason: "duplicate_email" };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, role: true },
  });

  return { ok: true, user };
}

/** Verifies email and password; returns safe user data or null on mismatch. */
export async function authenticateUser(
  prisma: PrismaClient,
  rawEmail: string,
  password: string,
): Promise<SafeUser | null> {
  const email = normalizeEmail(rawEmail);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, passwordHash: true },
  });
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, role: user.role };
}

/** Persists a new session record and returns the raw cookie token and expiration. */
export async function createSessionRecord(
  prisma: PrismaClient,
  userId: string,
  ttlDays: number = SESSION_TTL_DAYS,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { tokenHash, userId, expiresAt },
  });

  return { token, expiresAt };
}

/** Resolves a valid, unexpired session token to a safe user object. */
export async function getUserBySessionToken(
  prisma: PrismaClient,
  token: string,
  now: Date = new Date(),
): Promise<SafeUser | null> {
  if (!token) return null;
  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, email: true, role: true } },
    },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= now.getTime()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

/** Deletes a session record matching the given raw token, if present. */
export async function deleteSessionByToken(prisma: PrismaClient, token: string): Promise<void> {
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}
