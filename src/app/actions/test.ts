"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadTestQuestions } from "@/lib/content";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { gradeTest, type TestKind } from "@/lib/test-scoring";

export interface TestFormState {
  error?: string;
  submitted?: boolean;
}

/** Grades and persists a user's pre-test or post-test submission. */
export async function submitTestAction(
  kind: TestKind,
  _prevState: TestFormState,
  formData: FormData,
): Promise<TestFormState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/masuk");
  }

  if (kind === "pre") {
    const existingPre = await db.testScore.findFirst({
      where: { userId: user.id, kind: "pre" },
      select: { id: true },
    });
    if (existingPre) {
      revalidatePath("/tes/pre");
      return { submitted: true };
    }
  }

  const questions = await loadTestQuestions();
  const submitted: Record<string, string | undefined> = {};
  for (const question of questions) {
    const raw = formData.get(`q_${question.id}`);
    submitted[question.id] = typeof raw === "string" ? raw : undefined;
  }

  const graded = gradeTest(questions, submitted);
  if (!graded.ok) {
    return { error: graded.error };
  }

  await db.testScore.create({
    data: {
      userId: user.id,
      kind,
      score: graded.result.score,
      total: graded.result.total,
      answers: JSON.stringify(graded.result.answers),
    },
  });

  revalidatePath("/tes");
  revalidatePath(`/tes/${kind}`);
  revalidatePath("/admin");
  return { submitted: true };
}
