import { describe, expect, it } from "vitest";
import { normalizeFamilyName, normalizeText, tokenize } from "@/engine/normalizer";

describe("normalizeText", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalizeText("  Deep   Learning\n in  Neural ")).toBe("deep learning in neural");
  });

  it("removes punctuation, keeping words apart", () => {
    expect(normalizeText("Design elements, lessons learned: and research-agenda!")).toBe(
      "design elements lessons learned and research agenda",
    );
  });

  it("strips combining diacritics", () => {
    expect(normalizeText("Café Müller Señor")).toBe("cafe muller senor");
  });

  it("maps letters that Unicode does not decompose (Đ, Ł, ø, ß)", () => {
    expect(normalizeText("Đức Łukasz Søren Straße")).toBe("duc lukasz soren strasse");
  });

  it("treats curly quotes and dashes like plain punctuation", () => {
    expect(normalizeText("Students’ acid-base–pH—oxide")).toBe("students acid base ph oxide");
  });

  it("drops apostrophes inside words instead of splitting them", () => {
    expect(normalizeText("students' teachers’")).toBe("students teachers");
  });

  it("decodes common HTML entities from Crossref", () => {
    expect(normalizeText("Computers &amp; Education")).toBe("computers education");
  });

  it("returns an empty string for blank input", () => {
    expect(normalizeText("  \n\t ")).toBe("");
  });
});

describe("normalizeFamilyName", () => {
  it("normalizes diacritics so Đức matches Crossref's Duc", () => {
    expect(normalizeFamilyName("Đức")).toBe(normalizeFamilyName("Duc"));
  });

  it("keeps multi-word family names as one string", () => {
    expect(normalizeFamilyName("Ngoc  Son")).toBe("ngoc son");
  });

  it("removes trailing periods and commas", () => {
    expect(normalizeFamilyName("Hartono.")).toBe("hartono");
  });
});

describe("tokenize", () => {
  it("splits normalized text into word tokens", () => {
    expect(tokenize("Attention Is All You Need")).toEqual(["attention", "is", "all", "you", "need"]);
  });

  it("returns an empty array for blank input", () => {
    expect(tokenize("   ")).toEqual([]);
  });
});
