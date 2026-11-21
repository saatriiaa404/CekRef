import { describe, expect, it } from "vitest";
import { pickBest, scoreCandidate } from "@/engine/matcher";
import type { Candidate, ParsedReference } from "@/engine/types";

function parsed(overrides: Partial<ParsedReference> = {}): ParsedReference {
  return {
    raw: "",
    style: "apa",
    authors: [
      { family: "Radianti", given: "J." },
      { family: "Majchrzak", given: "T. A." },
    ],
    etAl: false,
    year: 2020,
    title: "A systematic review of immersive virtual reality applications for higher education",
    venue: "Computers & Education",
    doi: null,
    url: null,
    ...overrides,
  };
}

function candidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    doi: "10.1016/j.compedu.2019.103778",
    title: "A systematic review of immersive virtual reality applications for higher education",
    authors: [
      { family: "Radianti", given: "Jaziar" },
      { family: "Majchrzak", given: "Tim A." },
    ],
    year: 2020,
    venue: "Computers &amp; Education",
    ...overrides,
  };
}

const field = (result: ReturnType<typeof scoreCandidate>, name: string) =>
  result.fields.find((f) => f.field === name);

describe("scoreCandidate", () => {
  it("gives 1 when every field matches (case, punctuation and HTML entities ignored)", () => {
    expect(scoreCandidate(parsed(), candidate()).score).toBeCloseTo(1, 5);
  });

  it("reports all four fields in a fixed order", () => {
    expect(scoreCandidate(parsed(), candidate()).fields.map((f) => f.field)).toEqual([
      "title",
      "authors",
      "year",
      "venue",
    ]);
  });

  it("gives half year credit for a one-year difference", () => {
    const result = scoreCandidate(parsed({ year: 2021 }), candidate());
    expect(field(result, "year")?.similarity).toBe(0.5);
    expect(result.score).toBeCloseTo(1 - 0.15 * 0.5, 5);
  });

  it("gives no year credit for a larger difference", () => {
    expect(field(scoreCandidate(parsed({ year: 2017 }), candidate()), "year")?.similarity).toBe(0);
  });

  it("scores authors as the share of input family names found in the candidate", () => {
    const result = scoreCandidate(
      parsed({ authors: [{ family: "Radianti", given: null }, { family: "Wijaya", given: null }] }),
      candidate(),
    );
    expect(field(result, "authors")?.similarity).toBe(0.5);
    expect(result.missingAuthors).toEqual(["Wijaya"]);
  });

  it("matches family names across diacritics and multi-word Crossref names", () => {
    const result = scoreCandidate(
      parsed({ authors: [{ family: "Đức", given: null }, { family: "Son", given: null }] }),
      candidate({ authors: [{ family: "Duc", given: null }, { family: "Ngoc Son", given: null }] }),
    );
    expect(field(result, "authors")?.similarity).toBe(1);
  });

  it("redistributes the weight of fields missing from the input", () => {
    // Only title (0.50) and authors (0.25) remain: a perfect title and 0/2 authors -> 0.50 / 0.75.
    const result = scoreCandidate(
      parsed({ year: null, venue: null, authors: [{ family: "Lain", given: null }, { family: "Orang", given: null }] }),
      candidate(),
    );
    expect(field(result, "year")?.similarity).toBeNull();
    expect(field(result, "venue")?.similarity).toBeNull();
    expect(result.score).toBeCloseTo(0.5 / 0.75, 5);
  });

  it("also skips fields that Crossref does not provide", () => {
    const result = scoreCandidate(parsed(), candidate({ venue: null }));
    expect(field(result, "venue")?.similarity).toBeNull();
    expect(result.score).toBeCloseTo(1, 5);
  });

  it("returns 0 when nothing can be compared", () => {
    const empty = parsed({ title: null, authors: [], year: null, venue: null });
    expect(scoreCandidate(empty, candidate()).score).toBe(0);
  });

  it("uses the chosen title method", () => {
    const reordered = parsed({ title: "Higher education immersive virtual reality applications: a systematic review" });
    const jw = field(scoreCandidate(reordered, candidate(), { titleMethod: "jw" }), "title")?.similarity ?? 0;
    const jaccard = field(scoreCandidate(reordered, candidate(), { titleMethod: "jaccard" }), "title")?.similarity ?? 0;
    expect(jaccard).toBeGreaterThan(jw);
  });

  it("formats authors for display, marking et al.", () => {
    const result = scoreCandidate(parsed({ etAl: true }), candidate());
    expect(field(result, "authors")?.input).toBe("Radianti; Majchrzak; et al.");
    expect(field(result, "authors")?.database).toBe("Radianti; Majchrzak");
    expect(field(result, "year")?.input).toBe("2020");
  });
});

describe("pickBest", () => {
  it("returns null when there are no candidates", () => {
    expect(pickBest(parsed(), [])).toBeNull();
  });

  it("picks the candidate with the highest score", () => {
    const wrong = candidate({ title: "Deep learning in neural networks: An overview", year: 2015 });
    const best = pickBest(parsed(), [wrong, candidate()]);
    expect(best?.candidate.doi).toBe("10.1016/j.compedu.2019.103778");
    expect(best?.score).toBeCloseTo(1, 5);
  });
});
