import { describe, expect, it } from "vitest";
import { buildSearchQuery, checkParsed, checkReferences } from "@/engine/check";
import { parseReference } from "@/engine/parser";
import type { Candidate } from "@/engine/types";
import type { CrossrefClient, LookupOutcome } from "@/lib/crossref";

const SCHMIDHUBER: Candidate = {
  doi: "10.1016/j.neunet.2014.09.003",
  title: "Deep learning in neural networks: An overview",
  authors: [{ family: "Schmidhuber", given: "Jürgen" }],
  year: 2015,
  venue: "Neural Networks",
};

const IEEE_WITH_DOI =
  "J. Schmidhuber, “Deep learning in neural networks: An overview,” Neural Networks, vol. 61, pp. 85–117, Jan. 2015, doi: 10.1016/j.neunet.2014.09.003.";
const IEEE_NO_DOI = "J. Schmidhuber, “Deep learning in neural networks: An overview,” Neural Networks, vol. 61, pp. 85–117, Jan. 2015.";

/** Fake client: answers from fixed outcomes and records calls. */
function fakeCrossref(byDoi: LookupOutcome, bySearch: LookupOutcome) {
  const calls: string[] = [];
  const client: CrossrefClient = {
    getWorkByDoi: async (doi) => {
      calls.push(`doi:${doi}`);
      return byDoi;
    },
    searchBibliographic: async (query) => {
      calls.push(`search:${query}`);
      return bySearch;
    },
  };
  return { client, calls };
}

const ok = (candidates: Candidate[], fromCache = false): LookupOutcome => ({ kind: "ok", candidates, fromCache });
const notFound: LookupOutcome = { kind: "not_found", fromCache: false };

describe("buildSearchQuery", () => {
  it("builds the query from parsed fields when a title is known", () => {
    expect(buildSearchQuery(parseReference(IEEE_NO_DOI))).toBe(
      "Deep learning in neural networks: An overview Schmidhuber Neural Networks 2015",
    );
  });

  it("falls back to the raw text when the parser found no title", () => {
    const parsed = parseReference("Some free text about a paper");
    expect(buildSearchQuery(parsed)).toBe("Some free text about a paper");
  });
});

describe("checkParsed", () => {
  it("uses the DOI when the reference has one", async () => {
    const { client, calls } = fakeCrossref(ok([SCHMIDHUBER]), notFound);
    const result = await checkParsed(parseReference(IEEE_WITH_DOI), { crossref: client });
    expect(calls).toEqual(["doi:10.1016/j.neunet.2014.09.003"]);
    expect(result).toMatchObject({ label: "match", lookup: "doi", best: SCHMIDHUBER, fromCache: false });
    expect(result.score).toBeCloseTo(1, 5);
    expect(result.fields).toHaveLength(4);
  });

  it("falls back to search when Crossref does not know the DOI", async () => {
    const { client, calls } = fakeCrossref(notFound, ok([SCHMIDHUBER]));
    const result = await checkParsed(parseReference(IEEE_WITH_DOI), { crossref: client });
    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatch(/^search:/);
    expect(result.lookup).toBe("search");
    expect(result.reasons).toContain("DOI tidak ditemukan di Crossref; dicocokkan lewat pencarian.");
  });

  it("searches directly when there is no DOI", async () => {
    const { client, calls } = fakeCrossref(notFound, ok([SCHMIDHUBER]));
    const result = await checkParsed(parseReference(IEEE_NO_DOI), { crossref: client });
    expect(calls).toEqual(["search:Deep learning in neural networks: An overview Schmidhuber Neural Networks 2015"]);
    expect(result).toMatchObject({ label: "match", lookup: "search" });
  });

  it("returns not_found with no candidate when the search finds nothing", async () => {
    const { client } = fakeCrossref(notFound, notFound);
    const result = await checkParsed(parseReference(IEEE_NO_DOI), { crossref: client });
    expect(result).toMatchObject({ label: "not_found", best: null, fields: [], score: 0, lookup: "search" });
  });

  it("explains a demo-mode cache miss", async () => {
    const { client } = fakeCrossref({ kind: "unavailable", reason: "demo" }, notFound);
    const result = await checkParsed(parseReference(IEEE_WITH_DOI), { crossref: client });
    expect(result).toMatchObject({ label: "not_found", lookup: "none", best: null });
    expect(result.reasons).toEqual(["Mode demo: data referensi ini belum ada di cache."]);
  });

  it("marks the result as cached only when every lookup came from the cache", async () => {
    const cachedDoi = fakeCrossref(ok([SCHMIDHUBER], true), notFound);
    expect((await checkParsed(parseReference(IEEE_WITH_DOI), { crossref: cachedDoi.client })).fromCache).toBe(true);

    const mixed = fakeCrossref({ kind: "not_found", fromCache: true }, ok([SCHMIDHUBER], false));
    expect((await checkParsed(parseReference(IEEE_WITH_DOI), { crossref: mixed.client })).fromCache).toBe(false);
  });

  it("re-checks corrected fields without re-parsing", async () => {
    const { client } = fakeCrossref(notFound, ok([SCHMIDHUBER]));
    const wrong = { ...parseReference(IEEE_NO_DOI), year: 2001 };
    const corrected = { ...wrong, year: 2015 };
    expect((await checkParsed(wrong, { crossref: client })).reasons).toContain("Tahun berbeda (input 2001, database 2015).");
    expect((await checkParsed(corrected, { crossref: client })).label).toBe("match");
  });
});

describe("checkReferences", () => {
  it("checks every entry in order and reports progress", async () => {
    const { client } = fakeCrossref(ok([SCHMIDHUBER]), ok([SCHMIDHUBER]));
    const progress: Array<[number, number]> = [];
    const results = await checkReferences(`[1] ${IEEE_WITH_DOI}\n[2] Some free text`, {
      crossref: client,
      onProgress: (done, total) => progress.push([done, total]),
    });
    expect(results.map((r) => r.parsed.raw)).toEqual([IEEE_WITH_DOI, "Some free text"]);
    expect(progress).toEqual([
      [1, 2],
      [2, 2],
    ]);
  });

  it("returns an empty list for empty input", async () => {
    const { client } = fakeCrossref(notFound, notFound);
    expect(await checkReferences("   ", { crossref: client })).toEqual([]);
  });
});
