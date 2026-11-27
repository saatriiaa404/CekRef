export type QuestionAnswer = "real" | "problematic";
export type TestKind = "pre" | "post";

export interface TestQuestion {
  id: string;
  reference: string;
  answer: QuestionAnswer;
  explanation: string;
}

export interface PublicTestQuestion {
  id: string;
  reference: string;
}

export interface ScoreResult {
  score: number;
  total: number;
  answers: Record<string, QuestionAnswer>;
}

/** Strips answer keys and explanations before sending questions to the client. */
export function toPublicQuestions(questions: TestQuestion[]): PublicTestQuestion[] {
  return questions.map(({ id, reference }) => ({ id, reference }));
}

/** Grades submitted answers against the loaded question bank. */
export function gradeTest(
  questions: TestQuestion[],
  submitted: Record<string, string | undefined>,
): { ok: true; result: ScoreResult } | { ok: false; error: string } {
  if (questions.length === 0) {
    return { ok: false, error: "Belum ada soal tes yang tersedia." };
  }

  const answers: Record<string, QuestionAnswer> = {};
  let score = 0;

  for (const question of questions) {
    const choice = submitted[question.id];
    if (choice !== "real" && choice !== "problematic") {
      return {
        ok: false,
        error: "Semua soal wajib dijawab sebelum dikumpulkan.",
      };
    }
    answers[question.id] = choice;
    if (choice === question.answer) {
      score += 1;
    }
  }

  return {
    ok: true,
    result: {
      score,
      total: questions.length,
      answers,
    },
  };
}

export interface ScoreEntry {
  userId: string;
  kind: string;
  score: number;
  total: number;
}

export interface AdminTestSummary {
  participantCount: number;
  preAverage: number | null;
  postAverage: number | null;
  improvement: number | null;
  participants: Array<{
    userId: string;
    email: string;
    preScore: number | null;
    preTotal: number | null;
    postScore: number | null;
    postTotal: number | null;
  }>;
}

/** Computes aggregate pre-test vs post-test averages across users. */
export function summarizeTestScores(
  users: Array<{ id: string; email: string }>,
  scores: ScoreEntry[],
): AdminTestSummary {
  const byUser = new Map<
    string,
    { preScore: number | null; preTotal: number | null; postScore: number | null; postTotal: number | null }
  >();

  for (const s of scores) {
    const current = byUser.get(s.userId) ?? {
      preScore: null,
      preTotal: null,
      postScore: null,
      postTotal: null,
    };
    if (s.kind === "pre") {
      current.preScore = s.score;
      current.preTotal = s.total;
    } else if (s.kind === "post") {
      current.postScore = s.score;
      current.postTotal = s.total;
    }
    byUser.set(s.userId, current);
  }

  const emailById = new Map(users.map((u) => [u.id, u.email]));
  const participants = Array.from(byUser.entries())
    .map(([userId, data]) => ({
      userId,
      email: emailById.get(userId) ?? "-",
      ...data,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

  const preScores = participants.map((p) => p.preScore).filter((v): v is number => v !== null);
  const postScores = participants.map((p) => p.postScore).filter((v): v is number => v !== null);

  const avg = (values: number[]) =>
    values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

  const preAverage = avg(preScores);
  const postAverage = avg(postScores);
  const improvement =
    preAverage !== null && postAverage !== null ? postAverage - preAverage : null;

  return {
    participantCount: participants.length,
    preAverage,
    postAverage,
    improvement,
    participants,
  };
}
