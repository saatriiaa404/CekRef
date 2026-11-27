import { splitEntries } from "@/engine/splitter";

export const MAX_REFERENCE_ENTRIES = 50;
export const MAX_REFERENCE_CHARACTERS = 20_000;
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReferenceInputValidation =
  | { ok: true; entryCount: number; charCount: number }
  | { ok: false; error: string; entryCount: number; charCount: number };

/** Validates pasted reference lists against the 50-entry and 20,000-character limits. */
export function validateReferenceInput(text: string): ReferenceInputValidation {
  const charCount = text.length;
  const entries = splitEntries(text);
  const entryCount = entries.length;

  if (entryCount === 0 || text.trim().length === 0) {
    return {
      ok: false,
      error: "Masukkan minimal satu referensi sebelum memeriksa.",
      entryCount: 0,
      charCount,
    };
  }

  if (charCount > MAX_REFERENCE_CHARACTERS || entryCount > MAX_REFERENCE_ENTRIES) {
    return {
      ok: false,
      error: "Maksimal 50 referensi / 20.000 karakter per pemeriksaan.",
      entryCount,
      charCount,
    };
  }

  return { ok: true, entryCount, charCount };
}

/** Normalizes an email address by trimming surrounding whitespace and lowercasing. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Validates an email format for registration and login. */
export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  return normalized.length <= 254 && EMAIL_PATTERN.test(normalized);
}

/** Validates registration fields and returns an Indonesian error message if invalid. */
export function validateRegistrationInput(input: {
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return "Format email tidak valid.";
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (input.password !== input.confirmPassword) {
    return "Konfirmasi password tidak cocok.";
  }
  return null;
}
