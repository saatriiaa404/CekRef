import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { TestQuestion } from "./test-scoring";

export interface EducationStep {
  number: number;
  title: string;
  description: string;
  tip: string;
}

export interface EducationContent {
  title: string;
  subtitle: string;
  whyAiTitle: string;
  whyAiParagraphs: string[];
  whyAiExamples: Array<{ label: string; detail: string }>;
  manualStepsTitle: string;
  manualSteps: EducationStep[];
  closingNote: string;
}

/** Loads educational content from content/edukasi.json on the server. */
export async function loadEducationContent(
  rootDir: string = process.cwd(),
): Promise<EducationContent> {
  const filePath = join(rootDir, "content", "edukasi.json");
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as EducationContent;
}

/** Loads pre/post-test questions from content/soal.json on the server. */
export async function loadTestQuestions(
  rootDir: string = process.cwd(),
): Promise<TestQuestion[]> {
  const filePath = join(rootDir, "content", "soal.json");
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as { questions: TestQuestion[] };
  return parsed.questions;
}
