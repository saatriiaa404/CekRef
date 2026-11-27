import { describe, expect, it } from "vitest";
import {
  gradeTest,
  summarizeTestScores,
  toPublicQuestions,
  type TestQuestion,
} from "@/lib/test-scoring";

const SAMPLE_QUESTIONS: TestQuestion[] = [
  {
    id: "q1",
    reference: "Ref 1 (Asli)",
    answer: "real",
    explanation: "Valid.",
  },
  {
    id: "q2",
    reference: "Ref 2 (Bermasalah)",
    answer: "problematic",
    explanation: "DOI fiktif.",
  },
  {
    id: "q3",
    reference: "Ref 3 (Asli)",
    answer: "real",
    explanation: "Valid.",
  },
];

describe("toPublicQuestions", () => {
  it("strips answer keys and explanations", () => {
    const pub = toPublicQuestions(SAMPLE_QUESTIONS);
    expect(pub).toEqual([
      { id: "q1", reference: "Ref 1 (Asli)" },
      { id: "q2", reference: "Ref 2 (Bermasalah)" },
      { id: "q3", reference: "Ref 3 (Asli)" },
    ]);
  });
});

describe("gradeTest", () => {
  it("computes accurate score regardless of question count", () => {
    const graded = gradeTest(SAMPLE_QUESTIONS, {
      q1: "real",
      q2: "real",
      q3: "real",
    });
    expect(graded).toEqual({
      ok: true,
      result: {
        score: 2,
        total: 3,
        answers: { q1: "real", q2: "real", q3: "real" },
      },
    });
  });

  it("rejects incomplete submissions", () => {
    const graded = gradeTest(SAMPLE_QUESTIONS, { q1: "real" });
    expect(graded.ok).toBe(false);
  });
});

describe("summarizeTestScores", () => {
  it("computes average pre, average post, and improvement", () => {
    const users = [
      { id: "u1", email: "a@kampus.ac.id" },
      { id: "u2", email: "b@kampus.ac.id" },
    ];
    const scores = [
      { userId: "u1", kind: "pre", score: 5, total: 10 },
      { userId: "u1", kind: "post", score: 9, total: 10 },
      { userId: "u2", kind: "pre", score: 7, total: 10 },
      { userId: "u2", kind: "post", score: 8, total: 10 },
    ];

    const summary = summarizeTestScores(users, scores);
    expect(summary.participantCount).toBe(2);
    expect(summary.preAverage).toBe(6);
    expect(summary.postAverage).toBe(8.5);
    expect(summary.improvement).toBe(2.5);
  });

  it("handles empty scores gracefully", () => {
    const summary = summarizeTestScores([], []);
    expect(summary).toEqual({
      participantCount: 0,
      preAverage: null,
      postAverage: null,
      improvement: null,
      participants: [],
    });
  });
});
