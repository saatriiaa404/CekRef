// Central tunable settings. Phase 5 (evaluation) tunes these values; code must not hard-code them.

export type TitleMethod = "jw" | "jaccard";

export interface Weights {
  title: number;
  authors: number;
  year: number;
  venue: number;
}

export const config = {
  /** Field weights for the match score (CLAUDE.md section 4). */
  weights: { title: 0.5, authors: 0.25, year: 0.15, venue: 0.1 } satisfies Weights,

  thresholds: {
    /** score >= match -> "match" (Cocok) */
    match: 0.85,
    /** partial <= score < match -> "partial" (Cocok Sebagian) */
    partial: 0.6,
    /** DOI found but title similarity below this -> "DOI mengarah ke artikel lain" */
    doiTitleMismatch: 0.6,
    /** A compared field below this similarity gets its own explanation in reasons[]. */
    fieldMismatch: 0.85,
  },

  /** Similarity used for titles and venues. */
  titleMethod: "jw" as TitleMethod,

  crossref: {
    baseUrl: "https://api.crossref.org",
    timeoutMs: 8000,
    maxConcurrency: 3,
    /** Extra attempts after the first failure. */
    retries: 1,
    retryBaseDelayMs: 500,
    /** Candidates requested from the bibliographic search. */
    rows: 5,
  },
} as const;
