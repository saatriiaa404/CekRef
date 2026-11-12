// Text normalization used before any comparison.
// Goal: two spellings of the same title/name should become the same string.

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
};

// Letters that NFKD does not split into base letter + combining mark.
const SPECIAL_LETTERS: Record<string, string> = {
  đ: "d",
  Đ: "D",
  ł: "l",
  Ł: "L",
  ø: "o",
  Ø: "O",
  ß: "ss",
  æ: "ae",
  Æ: "AE",
  œ: "oe",
  Œ: "OE",
  ı: "i",
};

const SPECIAL_LETTER_RE = new RegExp(`[${Object.keys(SPECIAL_LETTERS).join("")}]`, "g");
const ENTITY_RE = /&(?:amp|lt|gt|quot|apos|#39);/g;
const APOSTROPHE_RE = /['’‘ʼ`]/g;
const COMBINING_MARK_RE = /\p{M}/gu;
const NON_ALPHANUMERIC_RE = /[^\p{L}\p{N}]+/gu;

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizeText(input: string): string {
  return input
    .replace(ENTITY_RE, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(SPECIAL_LETTER_RE, (ch) => SPECIAL_LETTERS[ch] ?? ch)
    .normalize("NFKD")
    .replace(COMBINING_MARK_RE, "")
    .toLowerCase()
    .replace(APOSTROPHE_RE, "")
    .replace(NON_ALPHANUMERIC_RE, " ")
    .trim();
}

/** Normalize an author's family name for comparison. */
export function normalizeFamilyName(name: string): string {
  return normalizeText(name);
}

/** Split text into normalized word tokens. */
export function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  return normalized === "" ? [] : normalized.split(" ");
}
