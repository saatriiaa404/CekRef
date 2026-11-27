import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

async function TestOverviewContent() {
  const user = await requireUser();
  const scores = await db.testScore.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { kind: true, score: true, total: true, createdAt: true },
  });

  const pre = scores.find((s) => s.kind === "pre");
  const post = scores.find((s) => s.kind === "post");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Pre-test &amp; Post-test</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Alur yang disarankan: kerjakan Pre-test, pelajari halaman Edukasi, lalu kerjakan Post-test.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Pre-test</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Ukur kemampuan awalmu membedakan referensi asli dan bermasalah.
            </p>
            {pre ? (
              <p className="mt-3 text-sm font-medium text-emerald-700">
                Sudah dikerjakan · Skor: {pre.score} / {pre.total}
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Belum dikerjakan</p>
            )}
          </div>
          <div className="mt-5">
            <Link
              href="/tes/pre"
              className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              {pre ? "Lihat Skor Pre-test" : "Kerjakan Pre-test"}
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Post-test</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Uji kembali pemahamanmu setelah membaca Edukasi dan melihat pembahasan soal.
            </p>
            {post ? (
              <p className="mt-3 text-sm font-medium text-emerald-700">
                Sudah dikerjakan · Skor: {post.score} / {post.total}
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Belum dikerjakan</p>
            )}
          </div>
          <div className="mt-5">
            <Link
              href="/tes/post"
              className="inline-block rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              {post ? "Lihat Hasil & Pembahasan" : "Kerjakan Post-test"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat ringkasan tes...</p>}>
        <TestOverviewContent />
      </Suspense>
    </main>
  );
}
