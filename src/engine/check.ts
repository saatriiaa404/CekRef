// Ties the engine together: split -> parse -> Crossref lookup -> match -> classify.
// Used by the CLI now and by the Cek page (Phase 3) later.
import type { CrossrefClient, LookupOutcome } from "../lib/crossref";
import { classify, type ClassifyContext } from "./classifier";
import { pickBest, type MatchOptions } from "./matcher";
import { parseReference } from "./parser";
import { splitEntries } from "./splitter";
import type { Candidate, CheckResult, LookupKind, ParsedReference } from "./types";

export interface CheckDeps {
  crossref: CrossrefClient;
  matchOptions?: Partial<MatchOptions>;
}

export interface CheckReferencesDeps extends CheckDeps {
  /** Called after each entry finishes, e.g. "Memeriksa 3 dari 12". */
  onProgress?: (done: number, total: number) => void;
}

/** Search text for Crossref: structured fields when the parser found a title, else the raw entry. */
export function buildSearchQuery(parsed: ParsedReference): string {
  if (!parsed.title) return parsed.raw;
  return [parsed.title, ...parsed.authors.map((a) => a.family), parsed.venue, parsed.year]
    .filter((part) => part !== null && part !== "")
    .join(" ");
}

interface LookupResult {
  candidates: Candidate[];
  context: ClassifyContext;
  fromCache: boolean;
}

async function findCandidates(parsed: ParsedReference, crossref: CrossrefClient): Promise<LookupResult> {
  const outcomes: LookupOutcome[] = [];
  const done = (candidates: Candidate[], lookup: LookupKind, extra: Partial<ClassifyContext> = {}): LookupResult => ({
    candidates,
    context: { lookup, doiNotFound: false, unavailable: null, ...extra },
    fromCache: outcomes.every((o) => o.kind !== "unavailable" && o.fromCache),
  });

  let doiNotFound = false;
  if (parsed.doi) {
    const byDoi = await crossref.getWorkByDoi(parsed.doi);
    outcomes.push(byDoi);
    if (byDoi.kind === "ok") return done(byDoi.candidates, "doi");
    if (byDoi.kind === "unavailable") return done([], "none", { unavailable: byDoi.reason });
    doiNotFound = true;
  }

  const bySearch = await crossref.searchBibliographic(buildSearchQuery(parsed));
  outcomes.push(bySearch);
  if (bySearch.kind === "unavailable") return done([], "none", { unavailable: bySearch.reason, doiNotFound });
  return done(bySearch.kind === "ok" ? bySearch.candidates : [], "search", { doiNotFound });
}

/** Check one already-parsed reference (also used to re-check after the user corrects fields). */
export async function checkParsed(parsed: ParsedReference, deps: CheckDeps): Promise<CheckResult> {
  const { candidates, context, fromCache } = await findCandidates(parsed, deps.crossref);
  const scored = pickBest(parsed, candidates, deps.matchOptions);
  const { label, score, reasons } = classify(scored, context);
  return {
    parsed,
    label,
    score,
    reasons,
    best: scored?.candidate ?? null,
    fields: scored?.fields ?? [],
    lookup: context.lookup,
    fromCache,
  };
}

/** Check a pasted reference list. Results keep the input order. */
export async function checkReferences(text: string, deps: CheckReferencesDeps): Promise<CheckResult[]> {
  const entries = splitEntries(text).map(parseReference);
  let done = 0;
  // Entries run concurrently; the Crossref client itself caps requests in flight.
  return Promise.all(
    entries.map(async (parsed) => {
      const result = await checkParsed(parsed, deps);
      done++;
      deps.onProgress?.(done, entries.length);
      return result;
    }),
  );
}
