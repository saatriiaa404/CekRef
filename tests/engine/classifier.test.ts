import { describe, expect, it } from "vitest";
import { classify, LABEL_TEXT } from "@/engine/classifier";
import type { ScoredCandidate } from "@/engine/matcher";
import type { FieldComparison } from "@/engine/types";

function scored(score: number, fields: Partial<Record<FieldComparison["field"], Partial<FieldComparison>>> = {}, missingAuthors: string[] = []): ScoredCandidate {
  const base = (field: FieldComparison["field"], input: string, database: string): FieldComparison => ({
    field,
    input,
    database,
    similarity: 1,
    ...fields[field],
  });
  return {
    candidate: { doi: "10.1/x", title: "Judul", authors: [], year: 2020, venue: "Jurnal" },
    score,
    fields: [
      base("title", "Judul", "Judul"),
      base("authors", "Hartono", "Hartono"),
      base("year", "2020", "2020"),
      base("venue", "Jurnal", "Jurnal"),
    ],
    missingAuthors,
  };
}

const search = { lookup: "search" as const, doiNotFound: false, unavailable: null };

describe("LABEL_TEXT", () => {
  it("uses the Indonesian labels and never says 'palsu'", () => {
    expect(LABEL_TEXT).toEqual({
      match: "Cocok",
      partial: "Cocok Sebagian",
      not_found: "Tidak Ditemukan di Database",
    });
    expect(Object.values(LABEL_TEXT).join(" ").toLowerCase()).not.toContain("palsu");
  });
});

describe("classify by score", () => {
  it.each([
    [0.85, "match"],
    [0.95, "match"],
    [0.6, "partial"],
    [0.84, "partial"],
    [0.59, "not_found"],
  ] as const)("score %f -> %s", (score, label) => {
    expect(classify(scored(score), search).label).toBe(label);
  });

  it("explains a full match", () => {
    expect(classify(scored(1), search).reasons).toContain("Semua data utama cocok dengan database.");
  });

  it("reports a low-scoring closest candidate without calling it fake", () => {
    const result = classify(scored(0.42), search);
    expect(result.label).toBe("not_found");
    expect(result.reasons).toContain("Kandidat terdekat di Crossref kurang mirip (skor 42%). Periksa secara manual.");
    expect(result.reasons.join(" ").toLowerCase()).not.toContain("palsu");
  });
});

describe("classify special cases", () => {
  it("labels 'not_found' when there is no candidate", () => {
    const result = classify(null, search);
    expect(result).toEqual({
      label: "not_found",
      score: 0,
      reasons: ["Tidak ada kandidat yang ditemukan di Crossref. Periksa secara manual."],
    });
  });

  it("flags a DOI that points to a different article, even with a low score", () => {
    const result = classify(scored(0.3, { title: { similarity: 0.4, database: "Artikel Lain" } }), {
      ...search,
      lookup: "doi",
    });
    expect(result.label).toBe("partial");
    expect(result.reasons[0]).toBe('DOI mengarah ke artikel lain (judul di database: "Artikel Lain").');
  });

  it("does not apply the DOI rule to search results", () => {
    expect(classify(scored(0.3, { title: { similarity: 0.4 } }), search).label).toBe("not_found");
  });

  it("explains that a DOI was not found and search was used instead", () => {
    expect(classify(scored(1), { ...search, doiNotFound: true }).reasons).toContain(
      "DOI tidak ditemukan di Crossref; dicocokkan lewat pencarian.",
    );
  });

  it("explains a cache miss in demo mode", () => {
    expect(classify(null, { ...search, lookup: "none", unavailable: "demo" }).reasons).toEqual([
      "Mode demo: data referensi ini belum ada di cache.",
    ]);
  });

  it("explains a network failure without blaming the reference", () => {
    const result = classify(null, { ...search, lookup: "none", unavailable: "network" });
    expect(result.label).toBe("not_found");
    expect(result.reasons).toEqual(["Crossref tidak dapat dihubungi, jadi referensi ini belum bisa diperiksa. Coba lagi nanti."]);
  });
});

describe("classify field reasons", () => {
  it("reports a year difference with both values", () => {
    const result = classify(scored(0.9, { year: { input: "2021", database: "2020", similarity: 0.5 } }), search);
    expect(result.reasons).toContain("Tahun berbeda (input 2021, database 2020).");
  });

  it("lists authors that are missing from the database", () => {
    const result = classify(scored(0.8, { authors: { similarity: 0.5 } }, ["Wijaya", "Putri"]), search);
    expect(result.reasons).toContain("Penulis tidak ditemukan di database: Wijaya, Putri.");
  });

  it("reports a partly similar title with its similarity", () => {
    const result = classify(scored(0.7, { title: { similarity: 0.72 } }), search);
    expect(result.reasons).toContain("Judul hanya mirip sebagian (kemiripan 72%).");
  });

  it("reports a different venue with the database value", () => {
    const result = classify(scored(0.9, { venue: { similarity: 0.3, database: "Neural Networks" } }), search);
    expect(result.reasons).toContain('Nama jurnal/konferensi berbeda (database: "Neural Networks").');
  });

  it("skips fields that were not compared", () => {
    const result = classify(scored(1, { year: { similarity: null, input: null } }), search);
    expect(result.reasons.join(" ")).not.toContain("Tahun");
  });
});
