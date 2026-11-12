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
