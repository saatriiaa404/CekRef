// Splits a pasted reference list into individual entry strings.
// Strategy (first rule that applies wins):
//   1. Lines starting with "[n]"  -> IEEE-style numbered list
//   2. Lines starting with "n."   -> numbered list (n up to 3 digits, so "2015." is not a marker)
//   3. Blank lines                -> one entry per block
//   4. Otherwise                  -> one entry per line

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
  const chunks = hasBlankLineBetweenEntries ? text.split(/\n[ \t]*\n/) : lines;

  return chunks.map(cleanEntry).filter((entry) => entry !== "");
}
