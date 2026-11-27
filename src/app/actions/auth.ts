"use server";

import { redirect } from "next/navigation";
import {
  authenticateUser,
  createSessionRecord,
  deleteSessionByToken,
  registerUser,
} from "@/lib/auth-core";
import { db } from "@/lib/db";
import {
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from "@/lib/session";
import { validateRegistrationInput } from "@/lib/validation";

export interface AuthFormState {
  error?: string;
}

/** Registers a new user with email + bcrypt password hash and redirects to pre-test. */
export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const validationError = validateRegistrationInput({
    email,
    password,
    confirmPassword,
  });
  if (validationError) {
    return { error: validationError };
  }

  const outcome = await registerUser(db, email, password);
  if (!outcome.ok) {
    return { error: "Email sudah terdaftar." };
  }

  const session = await createSessionRecord(db, outcome.user.id);
  await setSessionCookie(session.token, session.expiresAt);
  redirect("/tes/pre");
}

/** Signs an existing user in using a generic error message to prevent email enumeration. */
export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email.trim() || !password) {
    return { error: "Email atau password salah." };
  }

  const user = await authenticateUser(db, email, password);
  if (!user) {
    return { error: "Email atau password salah." };
  }

  const session = await createSessionRecord(db, user.id);
  await setSessionCookie(session.token, session.expiresAt);
  redirect("/");
}

/** Signs out the current user by deleting their DB session and clearing the cookie. */
export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await deleteSessionByToken(db, token);
  }
  await clearSessionCookie();
  redirect("/masuk");
}
