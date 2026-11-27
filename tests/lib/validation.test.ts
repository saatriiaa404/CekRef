import { describe, expect, it } from "vitest";
import {
  MAX_REFERENCE_CHARACTERS,
  MAX_REFERENCE_ENTRIES,
  validateReferenceInput,
  validateRegistrationInput,
} from "@/lib/validation";

describe("validateReferenceInput", () => {
  it("rejects empty or whitespace-only input", () => {
    expect(validateReferenceInput("").ok).toBe(false);
    expect(validateReferenceInput("   \n\n  ").ok).toBe(false);
  });

  it("accepts up to 50 entries within 20,000 characters", () => {
    const lines = Array.from(
      { length: MAX_REFERENCE_ENTRIES },
      (_, i) => `[${i + 1}] Author ${i + 1}, "Title ${i + 1}," Journal, 2024.`,
    ).join("\n");
    const result = validateReferenceInput(lines);
    expect(result).toEqual({
      ok: true,
      entryCount: MAX_REFERENCE_ENTRIES,
      charCount: lines.length,
    });
  });

  it("rejects more than 50 entries", () => {
    const lines = Array.from(
      { length: MAX_REFERENCE_ENTRIES + 1 },
      (_, i) => `[${i + 1}] Author ${i + 1}, "Title ${i + 1}," Journal, 2024.`,
    ).join("\n");
    const result = validateReferenceInput(lines);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Maksimal 50 referensi");
    }
  });

  it("rejects inputs longer than 20,000 characters", () => {
    const longText = "A".repeat(MAX_REFERENCE_CHARACTERS + 1);
    const result = validateReferenceInput(longText);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("20.000 karakter");
    }
  });
});

describe("validateRegistrationInput", () => {
  it("validates email, password length, and confirmation", () => {
    expect(
      validateRegistrationInput({
        email: "bukan-email",
        password: "password8",
        confirmPassword: "password8",
      }),
    ).toBe("Format email tidak valid.");

    expect(
      validateRegistrationInput({
        email: "user@kampus.ac.id",
        password: "123",
        confirmPassword: "123",
      }),
    ).toContain("8 karakter");

    expect(
      validateRegistrationInput({
        email: "user@kampus.ac.id",
        password: "password8",
        confirmPassword: "berbeda88",
      }),
    ).toBe("Konfirmasi password tidak cocok.");

    expect(
      validateRegistrationInput({
        email: "user@kampus.ac.id",
        password: "password8",
        confirmPassword: "password8",
      }),
    ).toBeNull();
  });
});
