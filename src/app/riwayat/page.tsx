import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { listUserHistories } from "@/lib/history";
import { requireUser } from "@/lib/session";

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

async function HistoryListContent() {
  const user = await requireUser();
  const histories = await listUserHistories(db, user.id);

  if (histories.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
        <p className="text-sm text-zinc-700">
          Belum ada pengecekan. Mulai di halaman Cek.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Ke Halaman Cek
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-5 py-3">Tanggal</th>
              <th className="px-5 py-3">Jumlah</th>
              <th className="px-5 py-3">Hasil</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {histories.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 font-medium text-zinc-900">
                  {DATE_FORMATTER.format(item.createdAt)}
                </td>
                <td className="px-5 py-3 text-zinc-700">{item.entryCount}</td>
                <td className="px-5 py-3 text-zinc-800">
                  <span className="mr-3">🟢 {item.counts.match}</span>
                  <span className="mr-3">🟡 {item.counts.partial}</span>
                  <span>⚪ {item.counts.notFound}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/riwayat/${item.id}`}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                  >
                    Lihat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {histories.map((item) => (
          <article
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900">
                {DATE_FORMATTER.format(item.createdAt)}
              </p>
              <p className="text-xs text-zinc-600">{item.entryCount} referensi</p>
              <p className="text-xs text-zinc-800">
                🟢 {item.counts.match} · 🟡 {item.counts.partial} · ⚪ {item.counts.notFound}
              </p>
            </div>
            <Link
              href={`/riwayat/${item.id}`}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Lihat
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}

export default function RiwayatPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Riwayat Pengecekan</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Daftar pemeriksaan daftar pustaka yang tersimpan di akunmu.
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-zinc-500">Memuat riwayat...</p>}>
        <HistoryListContent />
      </Suspense>
    </main>
  );
}
