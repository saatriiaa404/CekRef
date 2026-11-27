import Link from "next/link";
import { Suspense } from "react";
import { TestRunner } from "@/components/TestRunner";
import { loadTestQuestions } from "@/lib/content";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { toPublicQuestions } from "@/lib/test-scoring";

async function PreTestContent() {
  const user = await requireUser();
  const existing = await db.testScore.findFirst({
    where: { userId: user.id, kind: "pre" },
    orderBy: { createdAt: "asc" },
    select: { score: true, total: true },
  });

  if (existing) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-semibold text-zinc-900">Hasil Pre-test</h1>
        <p className="mt-3 text-lg font-medium text-zinc-800">
          Skor kamu: {existing.score} / {existing.total}
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Kunci jawaban dan pembahasan baru ditampilkan setelah kamu menyelesaikan post-test agar
          pengukuran belajar tetap adil.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/edukasi"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Lanjut ke Halaman Edukasi
          </Link>
          <Link
            href="/tes/post"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Kerjakan Post-test
          </Link>
        </div>
      </section>
    );
  }

  const questions = await loadTestQuestions();
  return <TestRunner kind="pre" questions={toPublicQuestions(questions)} />;
}

export default function PreTestPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat soal pre-test...</p>}>
        <PreTestContent />
      </Suspense>
    </main>
  );
}
