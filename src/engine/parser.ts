// Parses one reference entry (APA 7 or IEEE) into structured fields.
// Hand-written heuristics; anything unrecognized becomes style "unknown" rather than throwing.
import type { Author, CitationStyle, ParsedReference } from "./types";

const DOI_RE = /\b10\.\d{4,9}\/[^\s"<>]+/i;
const URL_RE = /https?:\/\/[^\s<>"]+/gi;
const TRAILING_PUNCT_RE = /[.,;)\]]+$/;

// APA year in parentheses: (2020), (2020a), (2020, May 3), (n.d.), (t.t.)
const APA_YEAR_RE = /\((?:(\d{4})[a-z]?(?:,[^)]*)?|n\.\s?d\.|t\.\s?t\.)\)\.?/i;
const INITIALS_RE = /^\p{Lu}\.(?:\s*-?\s*\p{Lu}\.)*$/u;
const ET_AL_RE = /,?\s*\bet al\.?/i;

const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const IEEE_YEAR_SEGMENT_RE = new RegExp(`^(?:${MONTH}\\s+)?((?:19|20)\\d{2})\\.?$`, "i");
const IEEE_VENUE_STOP_RE = /^(?:vol\.|no\.|pp?\.|art\.\s*no\.|doi\b)/i;

const QUOTE_PAIRS: Record<string, string> = { "“": "”", '"': '"' };

function extractDoi(text: string): string | null {
  const match = text.match(DOI_RE);
  return match ? match[0].replace(TRAILING_PUNCT_RE, "").toLowerCase() : null;
}

function extractUrl(text: string): string | null {
  for (const match of text.matchAll(URL_RE)) {
    const url = match[0].replace(TRAILING_PUNCT_RE, "");
    if (!/doi\.org\//i.test(url)) return url;
  }
  return null;
}

/** Remove URLs, DOIs and "[Online]. Available:" so they don't leak into title/venue. */
function stripLinks(text: string): string {
  return text
    .replace(URL_RE, " ")
    .replace(/\[online\]\.?/gi, " ")
    .replace(/available:\s*/gi, " ")
    .replace(/\bdoi:\s*\S+/gi, " ")
    .replace(new RegExp(DOI_RE.source, "gi"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

function emptyOrNull(text: string): string | null {
  const trimmed = text.trim();
  return trimmed === "" ? null : trimmed;
}

// ---------- APA ----------

/** "Dilasani, R., Sudiran, & Hartono." -> Dilasani (R.), Sudiran, Hartono */
function parseApaAuthors(text: string): { authors: Author[]; etAl: boolean } {
  const etAl = ET_AL_RE.test(text);
  const tokens = text
    .replace(ET_AL_RE, "")
    .replace(/&/g, ",")
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token !== "");

  const authors: Author[] = [];
  for (const token of tokens) {
    const previous = authors.at(-1);
    if (INITIALS_RE.test(token) && previous && previous.given === null) {
      previous.given = token;
    } else {
      authors.push({ family: token.replace(/\.$/, ""), given: null });
    }
  }
  return { authors, etAl };
}

// Words whose trailing period is an abbreviation, not the end of a title (compared lowercase).
const TITLE_ABBREVIATIONS = new Set(["e.g", "i.e", "vs", "etc", "al", "cf", "dr", "st", "no", "vol"]);
// Single capital letter or dotted initialism without its final period: "A", "U.S", "A.I".
const INITIALISM_RE = /^(?:\p{L}\.)*\p{Lu}$/u;

/**
 * Index of the mark that ends an APA title, or -1.
 * A colon never ends it; a period after "U.S", "e.g", "vs", etc. does not either.
 */
function findApaTitleEnd(text: string): number {
  for (const match of text.matchAll(/[.?!](?=\s|$)/g)) {
    const index = match.index ?? 0;
    if (text[index] !== ".") return index;
    const word = (text.slice(0, index).match(/(\S+)$/)?.[1] ?? "").replace(/^[^\p{L}]+/u, "");
    if (INITIALISM_RE.test(word) || TITLE_ABBREVIATIONS.has(word.toLowerCase())) continue;
    return index;
  }
  return -1;
}

function parseApa(raw: string, yearMatch: RegExpMatchArray): Omit<ParsedReference, "raw" | "doi" | "url"> {
  const yearStart = yearMatch.index ?? 0;
  const { authors, etAl } = parseApaAuthors(raw.slice(0, yearStart));
  const year = yearMatch[1] ? Number(yearMatch[1]) : null;

  const rest = stripLinks(raw.slice(yearStart + yearMatch[0].length));
  const titleEnd = findApaTitleEnd(rest);
  let title: string;
  let afterTitle: string;
  if (titleEnd === -1) {
    title = rest;
    afterTitle = "";
  } else {
    const keepMark = rest[titleEnd] !== ".";
    title = rest.slice(0, keepMark ? titleEnd + 1 : titleEnd);
    afterTitle = rest.slice(titleEnd + 1);
  }

  // Venue runs until ", <volume number>" or ", Article ...".
  const venueEnd = afterTitle.search(/,\s*(?=\d|Article\b|Art\.)/);
  const venue = (venueEnd === -1 ? afterTitle : afterTitle.slice(0, venueEnd)).replace(/\.\s*$/, "");

  return { style: "apa", authors, etAl, year, title: emptyOrNull(title), venue: emptyOrNull(venue) };
}

// ---------- IEEE ----------

/** "A. N. Gomez, Ł. Kaiser, and I. Polosukhin" -> family = last word of each name */
function parseIeeeAuthors(text: string): { authors: Author[]; etAl: boolean } {
  const etAl = ET_AL_RE.test(text);
  const names = text
    .replace(ET_AL_RE, "")
    .split(/\s*,\s*(?:and\s+)?|\s+and\s+/)
    .map((name) => name.trim())
    .filter((name) => name !== "");

  const authors = names.map((name): Author => {
    const words = name.split(/\s+/);
    const family = words.pop() ?? name;
    return { family, given: words.length > 0 ? words.join(" ") : null };
  });
  return { authors, etAl };
}

function parseIeee(raw: string, quoteStart: number, quoteEnd: number): Omit<ParsedReference, "raw" | "doi" | "url"> {
  const authorText = raw.slice(0, quoteStart).replace(/[\s,]+$/, "");
  const { authors, etAl } = parseIeeeAuthors(authorText);
  const title = raw.slice(quoteStart + 1, quoteEnd).replace(/[\s,.]+$/, "");

  const segments = stripLinks(raw.slice(quoteEnd + 1))
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment !== "");

  const venueParts: string[] = [];
  let year: number | null = null;
  let venueDone = false;
  for (const segment of segments) {
    const yearMatch = segment.match(IEEE_YEAR_SEGMENT_RE);
    if (yearMatch && year === null) year = Number(yearMatch[1]);
    if (yearMatch || IEEE_VENUE_STOP_RE.test(segment)) venueDone = true;
    if (!venueDone) venueParts.push(segment);
  }
  const venue = venueParts.join(", ").replace(/^in\s+/i, "").replace(/\.$/, "");

  return { style: "ieee", authors, etAl, year, title: emptyOrNull(title), venue: emptyOrNull(venue) };
}

// ---------- entry point ----------

function findQuotedTitle(raw: string): { start: number; end: number } | null {
  const start = raw.search(/[“"]/);
  if (start === -1) return null;
  const closing = QUOTE_PAIRS[raw[start]];
  const end = raw.indexOf(closing, start + 1);
  return end === -1 ? null : { start, end };
}

export function parseReference(raw: string): ParsedReference {
  const doi = extractDoi(raw);
  const url = extractUrl(raw);
  const yearMatch = raw.match(APA_YEAR_RE);
  const quoted = findQuotedTitle(raw);

  let style: CitationStyle = "unknown";
  if (yearMatch && (quoted === null || (yearMatch.index ?? 0) < quoted.start)) style = "apa";
  else if (quoted) style = "ieee";

  const fields =
    style === "apa" && yearMatch
      ? parseApa(raw, yearMatch)
      : style === "ieee" && quoted
        ? parseIeee(raw, quoted.start, quoted.end)
        : { style, authors: [], etAl: false, year: null, title: null, venue: null };

  return { raw, ...fields, doi, url };
}
