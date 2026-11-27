import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getUserBySessionToken,
  type SafeUser,
} from "./auth-core";
import { db } from "./db";

export const SESSION_COOKIE_NAME = "cekref_session";

/** Builds secure cookie attributes for session storage. */
export function buildSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  };
}

/** Reads the raw session token from the incoming request cookies. */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/** Sets the httpOnly, sameSite session cookie on the response. */
export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions(expiresAt));
}

/** Clears the session cookie from the browser. */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Resolves the currently signed-in user from the session cookie, or null. */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return getUserBySessionToken(db, token);
}

/** Requires a signed-in user; redirects to /masuk otherwise. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/masuk");
  }
  return user;
}

/** Requires an admin user; redirects non-admins away. */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/");
  }
  return user;
}
