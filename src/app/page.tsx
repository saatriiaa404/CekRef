import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-semibold text-zinc-900">CekRef</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Sistem verifikasi keaslian daftar pustaka berbasis pencocokan metadata Crossref untuk
          mendukung literasi sumber ilmiah mahasiswa.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Halaman utama pemeriksaan daftar pustaka (Fase 3) akan disambungkan setelah modul engine
          selesai digabungkan.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/tes/pre"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Mulai Pre-test
          </Link>
          <Link
            href="/edukasi"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Baca Edukasi
          </Link>
          <Link
            href="/riwayat"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Lihat Riwayat
          </Link>
        </div>
      </section>
    </main>
  );
}
