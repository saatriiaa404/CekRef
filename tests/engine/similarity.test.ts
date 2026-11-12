import { describe, expect, it } from "vitest";
import { jaccardTokens, jaroWinkler } from "@/engine/similarity";

describe("jaroWinkler", () => {
  // Reference values from Winkler (1990) / common textbook examples.
  it.each([
    ["MARTHA", "MARHTA", 0.961],
    ["DWAYNE", "DUANE", 0.84],
    ["DIXON", "DICKSONX", 0.813],
  ])("jaroWinkler(%s, %s) ≈ %f", (a, b, expected) => {
    expect(jaroWinkler(a, b)).toBeCloseTo(expected, 3);
  });

  it("returns 1 for identical strings", () => {
    expect(jaroWinkler("deep learning", "deep learning")).toBe(1);
  });

  it("returns 0 for strings with no common characters", () => {
    expect(jaroWinkler("abc", "xyz")).toBe(0);
  });

  it("returns 1 when both strings are empty", () => {
    expect(jaroWinkler("", "")).toBe(1);
  });

  it("returns 0 when only one string is empty", () => {
    expect(jaroWinkler("abc", "")).toBe(0);
    expect(jaroWinkler("", "abc")).toBe(0);
  });

  it("is symmetric", () => {
    expect(jaroWinkler("attention", "atention")).toBe(jaroWinkler("atention", "attention"));
  });

  it("stays within 0..1 even for long shared prefixes", () => {
    const score = jaroWinkler("abcdefgh", "abcdefgx");
    expect(score).toBeGreaterThan(0.9);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("compares raw strings (callers normalize first)", () => {
    expect(jaroWinkler("Deep", "deep")).toBeLessThan(1);
  });
});

describe("jaccardTokens", () => {
  it("returns 1 for the same words in a different order and case", () => {
    expect(jaccardTokens("Deep Learning Overview", "overview: deep learning")).toBe(1);
  });

  it("is intersection over union of token sets", () => {
    // {a, b, c} vs {b, c, d}: 2 shared / 4 total
    expect(jaccardTokens("a b c", "b c d")).toBe(0.5);
  });

  it("ignores duplicate tokens", () => {
    expect(jaccardTokens("the the model", "the model")).toBe(1);
  });

  it("returns 0 when there are no shared tokens", () => {
    expect(jaccardTokens("attention", "convolution")).toBe(0);
  });

  it("returns 1 when both inputs have no tokens", () => {
    expect(jaccardTokens("", " ... ")).toBe(1);
  });

  it("returns 0 when only one input has tokens", () => {
    expect(jaccardTokens("model", "")).toBe(0);
  });

  it("normalizes diacritics and punctuation before comparing", () => {
    expect(jaccardTokens("Đức’s review", "Ducs review")).toBe(1);
  });
});
