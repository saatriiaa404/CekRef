import { describe, expect, it } from "vitest";
import { loadEducationContent, loadTestQuestions } from "@/lib/content";

describe("content loaders", () => {
  it("loads education material with why-AI section and 3 manual steps", async () => {
    const edu = await loadEducationContent();
    expect(edu.whyAiParagraphs.length).toBeGreaterThan(0);
    expect(edu.manualSteps).toHaveLength(3);
  });

  it("loads pre/post test questions with valid answer labels", async () => {
    const questions = await loadTestQuestions();
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.reference.trim().length).toBeGreaterThan(0);
      expect(["real", "problematic"]).toContain(q.answer);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
    }
  });
});
