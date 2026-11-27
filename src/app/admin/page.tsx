import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { summarizeTestScores } from "@/lib/test-scoring";

function formatAvg(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1).replace(".", ",");
}

function formatDiff(value: number | null): string {
  if (value === null) return "—";
  const formatted = value.toFixed(1).replace(".", ",");
  return value > 0 ? `+${formatted}` : formatted;
}

async function AdminContent() {
  await requireAdmin();

  const [users, scores] = await Promise.all([
    db.user.findMany({ select: { id: true, email: true } }),
    db.testScore.findMany({
      orderBy: { createdAt: "asc" },
      select: { userId: true, kind: true, score: true, total: true },
    }),
  ]);

  const summary = summarizeTestScores(users, scores);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Ringkasan Pre-test vs Post-test
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Rekap rata-rata skor seluruh peserta untuk mengevaluasi peningkatan literasi sitasi.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Peserta</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            {summary.participantCount}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Rata-rata pre-test
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            {formatAvg(summary.preAverage)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Rata-rata post-test
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            {formatAvg(summary.postAverage)}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Peningkatan
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">
            {formatDiff(summary.improvement)}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        <div className="border-b border-zinc-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">Rincian per Peserta</h2>
        </div>

        {summary.participants.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">
            Belum ada peserta yang mengumpulkan pre-test atau post-test.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Pre-test</th>
                  <th className="px-5 py-3">Post-test</th>
                  <th className="px-5 py-3">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {summary.participants.map((p) => {
                  const diff =
                    p.preScore !== null && p.postScore !== null
                      ? p.postScore - p.preScore
                      : null;
                  return (
                    <tr key={p.userId}>
                      <td className="px-5 py-3 font-medium text-zinc-900">{p.email}</td>
                      <td className="px-5 py-3 text-zinc-700">
                        {p.preScore !== null ? `${p.preScore} / ${p.preTotal}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-zinc-700">
                        {p.postScore !== null ? `${p.postScore} / ${p.postTotal}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-zinc-700">
                        {diff === null ? "—" : diff > 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat ringkasan admin...</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}
