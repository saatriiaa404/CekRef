import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HistoryDetailView } from "@/components/HistoryDetailView";
import { db } from "@/lib/db";
import { getUserHistoryById } from "@/lib/history";
import { requireUser } from "@/lib/session";

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

async function HistoryDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const history = await getUserHistoryById(db, user.id, id);

  if (!history) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Detail Riwayat Pengecekan</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {DATE_FORMATTER.format(history.createdAt)} · {history.entryCount} referensi
          </p>
        </div>
        <Link
          href="/riwayat"
          className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Kembali ke Riwayat
        </Link>
      </div>

      <HistoryDetailView results={history.results} />
    </div>
  );
}

export default function RiwayatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat detail riwayat...</p>}>
        <HistoryDetailContent params={params} />
      </Suspense>
    </main>
  );
}
