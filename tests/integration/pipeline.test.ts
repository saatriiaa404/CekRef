// End-to-end: real fixture references + real (recorded) Crossref responses, fully offline.
// Re-record with `npm run crossref:record` if references.txt changes.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { TitleMethod } from "@/config";
import { checkReferences } from "@/engine/check";
import type { CheckResult, MatchLabel } from "@/engine/types";
import { createCrossrefClient, type CachedResponse } from "@/lib/crossref";
import { createMemoryCache } from "@/lib/memory-cache";

const FIXTURES = join(__dirname, "../fixtures");
const text = readFileSync(join(FIXTURES, "references.txt"), "utf8");
const recorded = JSON.parse(readFileSync(join(FIXTURES, "crossref/cache.json"), "utf8")) as Record<string, CachedResponse>;

async function run(titleMethod: TitleMethod): Promise<CheckResult[]> {
  // demoMode guarantees no network call: a missing recording would show up as a demo-mode reason.
  const crossref = createCrossrefClient({ cache: createMemoryCache(recorded), demoMode: true });
  return checkReferences(text, { crossref, matchOptions: { titleMethod } });
}

// Entry numbers (1-based, as in references-sources.md) that carry a DOI.
const WITH_DOI = [1, 2, 3, 4, 6, 7, 8, 9, 10, 13, 15];

describe.each(["jw", "jaccard"] as const)("pipeline on the real fixtures (%s)", (method) => {
  it("answers every entry from the recordings, without the network", async () => {
    const results = await run(method);
    expect(results).toHaveLength(15);
    for (const result of results) {
      expect(result.fromCache).toBe(true);
      expect(result.reasons.join(" ")).not.toContain("Mode demo");
    }
  });

  it("finds every DOI reference as Cocok with a perfect score", async () => {
    const results = await run(method);
    for (const no of WITH_DOI) {
      expect(results[no - 1], `entry ${no}`).toMatchObject({ label: "match", lookup: "doi" });
      expect(results[no - 1].score, `entry ${no}`).toBeCloseTo(1, 5);
    }
  });

  it("uses search for entries without a DOI", async () => {
    const results = await run(method);
    for (const no of [5, 11, 12, 14]) expect(results[no - 1].lookup, `entry ${no}`).toBe("search");
  });

  it("never uses the word 'palsu'", async () => {
    const all = (await run(method)).flatMap((r) => r.reasons).join(" ").toLowerCase();
    expect(all).not.toContain("palsu");
  });
});

describe("search-based entries: observed baseline for Phase 5 evaluation", () => {
  // Real Crossref behaviour recorded 2026-11-22. Crossref returns a *different* article for
  // entries 5 (JES, not indexed) and 12 (WHO page): Jaro-Winkler's prefix bonus rates those as
  // "partial", Jaccard rejects them. Entry 11 (NeurIPS) is not in Crossref; entry 14 (arXiv)
  // matches by title but Crossref lists a 2025 record.
  const expected: Record<TitleMethod, Record<number, MatchLabel>> = {
    jw: { 5: "partial", 11: "not_found", 12: "partial", 14: "partial" },
    jaccard: { 5: "not_found", 11: "not_found", 12: "not_found", 14: "partial" },
  };

  it.each(["jw", "jaccard"] as const)("%s", async (method) => {
    const results = await run(method);
    const labels = Object.fromEntries(Object.keys(expected[method]).map((no) => [no, results[Number(no) - 1].label]));
    expect(labels).toEqual(expected[method]);
  });

  it("explains the arXiv year difference", async () => {
    const [, , , , , , , , , , , , , vaswani] = await run("jw");
    expect(vaswani.reasons).toContain("Tahun berbeda (input 2017, database 2025).");
  });
});
