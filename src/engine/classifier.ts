// Turns a match score into a label plus Indonesian explanations.
// Never calls a reference "fake": the lowest label is "Tidak Ditemukan di Database".
import { config } from "../config";
import type { ScoredCandidate } from "./matcher";
import type { FieldComparison, LookupKind, MatchLabel } from "./types";

export const LABEL_TEXT: Record<MatchLabel, string> = {
  match: "Cocok",
  partial: "Cocok Sebagian",
  not_found: "Tidak Ditemukan di Database",
};

export interface ClassifyContext {
  /** How the candidate was found. */
  lookup: LookupKind;
  /** The input had a DOI, Crossref did not know it, and search was used instead. */
  doiNotFound: boolean;
  /** Why Crossref could not be consulted at all, if that happened. */
  unavailable: "demo" | "network" | null;
}

export interface Classification {
  label: MatchLabel;
  score: number;
  reasons: string[];
}

type Thresholds = typeof config.thresholds;

const percent = (value: number) => `${Math.round(value * 100)}%`;

function fieldOf(scored: ScoredCandidate, name: FieldComparison["field"]): FieldComparison | undefined {
  return scored.fields.find((f) => f.field === name);
}

function fieldReasons(scored: ScoredCandidate, thresholds: Thresholds, skipTitle: boolean): string[] {
  const reasons: string[] = [];
  const below = (f: FieldComparison | undefined): f is FieldComparison =>
    f !== undefined && f.similarity !== null && f.similarity < thresholds.fieldMismatch;

  const title = fieldOf(scored, "title");
  if (!skipTitle && below(title)) reasons.push(`Judul hanya mirip sebagian (kemiripan ${percent(title.similarity ?? 0)}).`);

  if (scored.missingAuthors.length > 0) {
    reasons.push(`Penulis tidak ditemukan di database: ${scored.missingAuthors.join(", ")}.`);
  }

  const year = fieldOf(scored, "year");
  if (year && year.similarity !== null && year.similarity < 1) {
    reasons.push(`Tahun berbeda (input ${year.input}, database ${year.database}).`);
  }

  const venue = fieldOf(scored, "venue");
  if (below(venue)) reasons.push(`Nama jurnal/konferensi berbeda (database: "${venue.database}").`);

  return reasons;
}

export function classify(
  scored: ScoredCandidate | null,
  context: ClassifyContext,
  thresholds: Thresholds = config.thresholds,
): Classification {
  if (context.unavailable === "demo") {
    return { label: "not_found", score: 0, reasons: ["Mode demo: data referensi ini belum ada di cache."] };
  }
  if (context.unavailable === "network") {
    return {
      label: "not_found",
      score: 0,
      reasons: ["Crossref tidak dapat dihubungi, jadi referensi ini belum bisa diperiksa. Coba lagi nanti."],
    };
  }
  if (scored === null) {
    return {
      label: "not_found",
      score: 0,
      reasons: ["Tidak ada kandidat yang ditemukan di Crossref. Periksa secara manual."],
    };
  }

  const { score } = scored;
  const title = fieldOf(scored, "title");
  const doiPointsElsewhere =
    context.lookup === "doi" &&
    title !== undefined &&
    title.similarity !== null &&
    title.similarity < thresholds.doiTitleMismatch;

  let label: MatchLabel;
  if (doiPointsElsewhere) label = "partial";
  else if (score >= thresholds.match) label = "match";
  else if (score >= thresholds.partial) label = "partial";
  else label = "not_found";

  const reasons: string[] = [];
  if (doiPointsElsewhere) reasons.push(`DOI mengarah ke artikel lain (judul di database: "${title.database}").`);

  const details = fieldReasons(scored, thresholds, doiPointsElsewhere);
  reasons.push(...details);

  if (label === "not_found") {
    reasons.unshift(`Kandidat terdekat di Crossref kurang mirip (skor ${percent(score)}). Periksa secara manual.`);
  } else if (label === "match" && details.length === 0) {
    reasons.push("Semua data utama cocok dengan database.");
  }

  if (context.doiNotFound) reasons.push("DOI tidak ditemukan di Crossref; dicocokkan lewat pencarian.");

  return { label, score, reasons };
}
