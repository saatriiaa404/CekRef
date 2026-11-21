// Scores Crossref candidates against a parsed reference and picks the best one.
import { config, type TitleMethod, type Weights } from "../config";
import { normalizeFamilyName, normalizeText, tokenize } from "./normalizer";
import { jaccardTokens, jaroWinkler } from "./similarity";
import type { Author, Candidate, ComparedField, FieldComparison, ParsedReference } from "./types";

export interface MatchOptions {
  titleMethod: TitleMethod;
  weights: Weights;
}

export interface ScoredCandidate {
  candidate: Candidate;
  /** Weighted score 0..1 over the fields both sides provide. */
  score: number;
  fields: FieldComparison[];
  /** Input family names (as written) that were not found in the candidate. */
  missingAuthors: string[];
}

const DEFAULT_OPTIONS: MatchOptions = { titleMethod: config.titleMethod, weights: config.weights };

function isBlank(value: string | null): value is null {
  return value === null || normalizeText(value) === "";
}

/** Similarity of two free-text fields (titles, venues) with the chosen method. */
export function textSimilarity(a: string, b: string, method: TitleMethod): number {
  return method === "jaccard" ? jaccardTokens(a, b) : jaroWinkler(normalizeText(a), normalizeText(b));
}

/** 1 for the same year, 0.5 when one year apart, otherwise 0. */
function yearSimilarity(a: number, b: number): number {
  const gap = Math.abs(a - b);
  return gap === 0 ? 1 : gap === 1 ? 0.5 : 0;
}

/**
 * Two family names match when they are equal after normalization, or when one is a
 * word-subset of the other (Crossref sometimes stores "Ngoc Son" for an input "Son").
 */
function familyNamesMatch(input: string, other: string): boolean {
  const a = normalizeFamilyName(input);
  const b = normalizeFamilyName(other);
  if (a === "" || b === "") return false;
  if (a === b) return true;
  const aWords = tokenize(a);
  const bWords = tokenize(b);
  const aInB = aWords.every((word) => bWords.includes(word));
  const bInA = bWords.every((word) => aWords.includes(word));
  return aInB || bInA;
}

function formatAuthors(authors: Author[], etAl: boolean): string | null {
  if (authors.length === 0) return null;
  const names = authors.map((a) => a.family);
  if (etAl) names.push("et al.");
  return names.join("; ");
}

export function scoreCandidate(
  parsed: ParsedReference,
  candidate: Candidate,
  options: Partial<MatchOptions> = {},
): ScoredCandidate {
  const { titleMethod, weights } = { ...DEFAULT_OPTIONS, ...options };

  const title =
    isBlank(parsed.title) || isBlank(candidate.title)
      ? null
      : textSimilarity(parsed.title, candidate.title, titleMethod);

  const venue =
    isBlank(parsed.venue) || isBlank(candidate.venue)
      ? null
      : textSimilarity(parsed.venue, candidate.venue, titleMethod);

  const year = parsed.year === null || candidate.year === null ? null : yearSimilarity(parsed.year, candidate.year);

  let authors: number | null = null;
  const missingAuthors: string[] = [];
  if (parsed.authors.length > 0 && candidate.authors.length > 0) {
    for (const author of parsed.authors) {
      if (!candidate.authors.some((c) => familyNamesMatch(author.family, c.family))) missingAuthors.push(author.family);
    }
    authors = (parsed.authors.length - missingAuthors.length) / parsed.authors.length;
  }

  const similarities: Record<ComparedField, number | null> = { title, authors, year, venue };

  // Weighted mean over the fields both sides provide; skipped fields give their weight to the rest.
  let weighted = 0;
  let totalWeight = 0;
  for (const name of Object.keys(similarities) as ComparedField[]) {
    const value = similarities[name];
    if (value === null) continue;
    weighted += weights[name] * value;
    totalWeight += weights[name];
  }

  const fields: FieldComparison[] = [
    { field: "title", input: parsed.title, database: candidate.title, similarity: title },
    {
      field: "authors",
      input: formatAuthors(parsed.authors, parsed.etAl),
      database: formatAuthors(candidate.authors, false),
      similarity: authors,
    },
    {
      field: "year",
      input: parsed.year === null ? null : String(parsed.year),
      database: candidate.year === null ? null : String(candidate.year),
      similarity: year,
    },
    { field: "venue", input: parsed.venue, database: candidate.venue, similarity: venue },
  ];

  return { candidate, score: totalWeight === 0 ? 0 : weighted / totalWeight, fields, missingAuthors };
}

/** Highest-scoring candidate, or null when the list is empty. */
export function pickBest(
  parsed: ParsedReference,
  candidates: Candidate[],
  options: Partial<MatchOptions> = {},
): ScoredCandidate | null {
  let best: ScoredCandidate | null = null;
  for (const candidate of candidates) {
    const scored = scoreCandidate(parsed, candidate, options);
    if (best === null || scored.score > best.score) best = scored;
  }
  return best;
}
