import type { ParsedReference } from "@/engine/types";
import type { PrismaClient } from "@/generated/prisma/client";

// Mirrors Phase 2's CheckResult contract from src/engine/types.ts (PR #3).
export type MatchLabel = "match" | "partial" | "not_found";
export type LookupKind = "doi" | "search" | "none";
export type ComparedField = "title" | "authors" | "year" | "venue";

export interface Candidate {
  doi: string | null;
  title: string | null;
  authors: Array<{ family: string; given: string | null }>;
  year: number | null;
  venue: string | null;
}

export interface FieldComparison {
  field: ComparedField;
  input: string | null;
  database: string | null;
  similarity: number | null;
}

export interface StoredCheckResult {
  parsed: ParsedReference;
  label: MatchLabel;
  score: number;
  reasons: string[];
  best: Candidate | null;
  fields: FieldComparison[];
  lookup: LookupKind;
  fromCache: boolean;
}

export const LABEL_TEXT: Record<MatchLabel, string> = {
  match: "Cocok",
  partial: "Cocok Sebagian",
  not_found: "Tidak Ditemukan di Database",
};

export const FIELD_LABEL_TEXT: Record<ComparedField, string> = {
  title: "Judul",
  authors: "Penulis",
  year: "Tahun",
  venue: "Jurnal",
};

export interface LabelCounts {
  match: number;
  partial: number;
  notFound: number;
}

/** Counts how many entries fell into each label category. */
export function countLabels(results: StoredCheckResult[]): LabelCounts {
  const counts: LabelCounts = { match: 0, partial: 0, notFound: 0 };
  for (const item of results) {
    if (item.label === "match") counts.match += 1;
    else if (item.label === "partial") counts.partial += 1;
    else counts.notFound += 1;
  }
  return counts;
}

/** Parses serialized CheckResult JSON safely, returning an empty list if malformed. */
export function parseHistoryResults(rawJson: string): StoredCheckResult[] {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredCheckResult[];
  } catch {
    return [];
  }
}

/** Saves a completed check batch into CheckHistory for the given user. */
export async function saveCheckHistory(
  prisma: PrismaClient,
  userId: string,
  results: StoredCheckResult[],
): Promise<string> {
  const record = await prisma.checkHistory.create({
    data: {
      userId,
      entryCount: results.length,
      results: JSON.stringify(results),
    },
    select: { id: true },
  });
  return record.id;
}

/** Lists check histories owned by a user, newest first. */
export async function listUserHistories(prisma: PrismaClient, userId: string) {
  const rows = await prisma.checkHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      entryCount: true,
      results: true,
      createdAt: true,
    },
  });

  return rows.map((row) => {
    const parsed = parseHistoryResults(row.results);
    return {
      id: row.id,
      entryCount: row.entryCount,
      counts: countLabels(parsed),
      createdAt: row.createdAt,
    };
  });
}

/** Fetches one check history record only if it belongs to the specified user. */
export async function getUserHistoryById(
  prisma: PrismaClient,
  userId: string,
  historyId: string,
) {
  const row = await prisma.checkHistory.findFirst({
    where: { id: historyId, userId },
    select: {
      id: true,
      entryCount: true,
      results: true,
      createdAt: true,
    },
  });
  if (!row) return null;

  const results = parseHistoryResults(row.results);
  return {
    id: row.id,
    entryCount: row.entryCount,
    counts: countLabels(results),
    results,
    createdAt: row.createdAt,
  };
}
