import Link from "next/link";
import { Suspense } from "react";
import { TestRunner } from "@/components/TestRunner";
import { loadTestQuestions } from "@/lib/content";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toPublicQuestions, type QuestionAnswer } from "@/lib/test-scoring";

const ANSWER_LABEL: Record<QuestionAnswer, string> = {
  real: "Asli",
  problematic: "Bermasalah",
};

function parseAnswers(raw: string | null): Record<string, QuestionAnswer> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, QuestionAnswer>;
  } catch {
    return {};
  }
}

async function PostTestContent({
  searchParams,
}: {
  searchParams: Promise<{ ulang?: string }>;
}) {
  const user = await requireUser();
  const { ulang } = await searchParams;
  const questions = await loadTestQuestions();

  const [preScore, latestPost] = await Promise.all([
    db.testScore.findFirst({
      where: { userId: user.id, kind: "pre" },
      orderBy: { createdAt: "asc" },
      select: { score: true, total: true },
    }),
    db.testScore.findFirst({
      where: { userId: user.id, kind: "post" },
      orderBy: { createdAt: "desc" },
      select: { score: true, total: true, answers: true },
    }),
  ]);

  if (!latestPost || ulang === "1") {
    return <TestRunner kind="post" questions={toPublicQuestions(questions)} />;
  }

  const userAnswers = parseAnswers(latestPost.answers);
  const diff = preScore ? latestPost.score - preScore.score : null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-semibold text-zinc-900">Hasil Post-test</h1>
        <p className="mt-2 text-lg font-medium text-zinc-900">
          Skor kamu: {latestPost.score} / {latestPost.total}
        </p>

        {preScore && diff !== null && (
          <div className="mt-4 grid gap-3 rounded-lg bg-zinc-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-zinc-500">Pre-test</p>
              <p className="font-semibold text-zinc-900">
                {preScore.score} / {preScore.total}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Post-test</p>
              <p className="font-semibold text-zinc-900">
                {latestPost.score} / {latestPost.total}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">Perubahan</p>
              <p className="font-semibold text-zinc-900">
                {diff > 0 ? `+${diff}` : diff}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/edukasi"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Kembali ke Edukasi
          </Link>
          <Link
            href="/tes/post?ulang=1"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Kerjakan Ulang Post-test
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-zinc-900">Pembahasan Setiap Soal</h2>
        {questions.map((question, index) => {
          const chosen = userAnswers[question.id];
          const isCorrect = chosen === question.answer;
          return (
            <article
              key={question.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Soal {index + 1}
                </span>
                <span
                  className={
                    isCorrect
                      ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                      : "rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900"
                  }
                >
                  {isCorrect ? "Jawaban tepat" : "Perlu diperhatikan"}
                </span>
              </div>

              <p className="mt-2 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-800">
                {question.reference}
              </p>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
                <span>
                  Jawabanmu:{" "}
                  <strong className="text-zinc-900">
                    {chosen ? ANSWER_LABEL[chosen] : "Tidak ada"}
                  </strong>
                </span>
                <span>
                  Kunci:{" "}
                  <strong className="text-zinc-900">{ANSWER_LABEL[question.answer]}</strong>
                </span>
              </div>

              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                {question.explanation}
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default function PostTestPage({
  searchParams,
}: {
  searchParams: Promise<{ ulang?: string }>;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat soal post-test...</p>}>
        <PostTestContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
