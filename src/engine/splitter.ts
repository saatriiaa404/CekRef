// Splits a pasted reference list into individual entry strings.
// Strategy (first rule that applies wins):
//   1. Lines starting with "[n]"  -> IEEE-style numbered list
//   2. Lines starting with "n."   -> numbered list (n up to 3 digits, so "2015." is not a marker)
//   3. Blank lines                -> one entry per block
//   4. Otherwise                  -> a line that looks like an entry start (APA author or
//                                    early year, IEEE initials + quoted title) begins a new
//                                    entry; other lines are wrapped text of the previous one.
//                                    If no line looks like a start: one entry per line.

const BRACKET_MARKER = /^\s*\[\d{1,3}\]\s*/;
const DOT_MARKER = /^\s*\d{1,3}\.\s+/;

/** Join wrapped lines with single spaces and collapse whitespace. */
function cleanEntry(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function splitOnMarker(lines: string[], marker: RegExp): string[] {
  const entries: string[] = [];
  let current: string[] | null = null;

  for (const line of lines) {
    if (marker.test(line)) {
      if (current) entries.push(current.join(" "));
      current = [line.replace(marker, "")];
    } else if (current) {
      current.push(line);
    }
    // Text before the first marker (e.g. a "Daftar Pustaka" heading) is dropped.
  }
  if (current) entries.push(current.join(" "));

  return entries.map(cleanEntry).filter((entry) => entry !== "");
}

export function splitEntries(input: string): string[] {
  const text = input.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const firstLine = lines.find((line) => line.trim() !== "");
  if (firstLine === undefined) return [];

  if (BRACKET_MARKER.test(firstLine)) return splitOnMarker(lines, BRACKET_MARKER);
  if (DOT_MARKER.test(firstLine)) return splitOnMarker(lines, DOT_MARKER);

  const hasBlankLineBetweenEntries = /\S[ \t]*\n[ \t]*\n\s*\S/.test(text);
  if (hasBlankLineBetweenEntries) {
    return text.split(/\n[ \t]*\n/).map(cleanEntry).filter((entry) => entry !== "");
  }
  return splitOnEntryStarts(lines.filter((line) => line.trim() !== ""));
}

// "Surname, X." optionally preceded by lowercase particles ("van der Berg, J.").
const APA_AUTHOR_START =
  /^(?:(?:van|von|de|der|den|da|di|du|la|le|del|della|dos|bin|binti|al|el|ten|ter)\s+)*\p{Lu}[\p{L}'’-]*(?:\s+\p{Lu}[\p{L}'’-]*)*,\s+\p{Lu}\./u;
// An APA year "(2020)", "(n.d.)", "(t.t.)" early in the line also covers organization authors.
const APA_EARLY_YEAR = /^[^()]{1,150}\((?:\d{4}[a-z]?(?:,[^)]*)?|n\.\s?d\.|t\.\s?t\.)\)/i;
// IEEE "X. Surname" together with a quoted title on the same line.
const IEEE_AUTHOR_START = /^\p{Lu}\.(?:\s*-?\s*\p{Lu}\.)*\s+\S/u;

function looksLikeEntryStart(line: string): boolean {
  const trimmed = line.trim();
  return (
    APA_AUTHOR_START.test(trimmed) ||
    APA_EARLY_YEAR.test(trimmed) ||
    (IEEE_AUTHOR_START.test(trimmed) && /[“"]/.test(trimmed))
  );
}

/** No blank lines or numbers: a line that looks like a new entry starts one, others are wrapped text. */
function splitOnEntryStarts(lines: string[]): string[] {
  if (!lines.some(looksLikeEntryStart)) return lines.map(cleanEntry);

  const entries: string[][] = [];
  for (const line of lines) {
    const current = entries.at(-1);
    if (current === undefined || looksLikeEntryStart(line)) entries.push([line]);
    else current.push(line);
  }
  return entries.map((entry) => cleanEntry(entry.join(" ")));
}
