// Hand-written string similarity measures. Both return a score in 0..1.
import { tokenize } from "./normalizer";

const WINKLER_PREFIX_SCALE = 0.1;
const WINKLER_MAX_PREFIX = 4;

/** Jaro similarity: shared characters within a sliding window, penalized by transpositions. */
function jaro(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const window = Math.max(Math.floor(Math.max(a.length, b.length) / 2) - 1, 0);
  const aMatched = new Array<boolean>(a.length).fill(false);
  const bMatched = new Array<boolean>(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - window);
    const end = Math.min(i + window + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatched[j] || a[i] !== b[j]) continue;
      aMatched[i] = true;
      bMatched[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  // Count matched characters that appear in a different order.
  let outOfOrder = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatched[i]) continue;
    while (!bMatched[k]) k++;
    if (a[i] !== b[k]) outOfOrder++;
    k++;
  }
  const transpositions = outOfOrder / 2;

  return (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3;
}

/**
 * Jaro-Winkler similarity: Jaro boosted for a shared prefix (up to 4 chars).
 * Compares the strings as given; normalize them first for case/diacritic-insensitive results.
 */
export function jaroWinkler(a: string, b: string): number {
  const base = jaro(a, b);

  let prefix = 0;
  const limit = Math.min(WINKLER_MAX_PREFIX, a.length, b.length);
  while (prefix < limit && a[prefix] === b[prefix]) prefix++;

  return base + prefix * WINKLER_PREFIX_SCALE * (1 - base);
}

/** Jaccard index of the two inputs' normalized word-token sets. */
export function jaccardTokens(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;

  let shared = 0;
  for (const token of setA) if (setB.has(token)) shared++;

  const union = setA.size + setB.size - shared;
  return shared / union;
}
