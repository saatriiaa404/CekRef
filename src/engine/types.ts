// Shared data shapes for the reference-checking engine.

export type CitationStyle = "apa" | "ieee" | "unknown";

export interface Author {
  /** Family (last) name, or the full name for an organization author. */
  family: string;
  /** Given names or initials as written, e.g. "A. N."; null when absent. */
  given: string | null;
}

export interface ParsedReference {
  raw: string;
  style: CitationStyle;
  authors: Author[];
  /** True when the author list was truncated with "et al.". */
  etAl: boolean;
  year: number | null;
  title: string | null;
  venue: string | null;
  /** Bare DOI in lowercase, e.g. "10.1016/j.neunet.2014.09.003". */
  doi: string | null;
  /** Non-DOI URL found in the entry, if any. */
  url: string | null;
}

// ---------- Phase 2: matching results ----------

/** Result label. The UI shows these as "Cocok", "Cocok Sebagian", "Tidak Ditemukan di Database". */
export type MatchLabel = "match" | "partial" | "not_found";

/** One article as described by Crossref, reduced to the fields we compare. */
export interface Candidate {
  doi: string | null;
  title: string | null;
  authors: Author[];
  year: number | null;
  venue: string | null;
}

export type ComparedField = "title" | "authors" | "year" | "venue";

/** Side-by-side view of one field, used by the Detail page. */
export interface FieldComparison {
  field: ComparedField;
  /** Value written by the user (authors joined with "; "). */
  input: string | null;
  /** Value found in Crossref. */
  database: string | null;
  /** 0..1, or null when the field was skipped because one side is empty. */
  similarity: number | null;
}

/** How the best candidate was found. */
export type LookupKind = "doi" | "search" | "none";

/** Outcome of checking one reference entry. */
export interface CheckResult {
  /** Parser output; the user may correct it and check again. */
  parsed: ParsedReference;
  label: MatchLabel;
  /** Weighted score 0..1 of the best candidate (0 when there is none). */
  score: number;
  /** Human-readable explanations in Indonesian. */
  reasons: string[];
  /** Best-matching Crossref candidate, or null when none was found. */
  best: Candidate | null;
  /** Per-field comparison against `best` (empty when there is no candidate). */
  fields: FieldComparison[];
  lookup: LookupKind;
  /** True when every Crossref response used came from the cache. */
  fromCache: boolean;
}
