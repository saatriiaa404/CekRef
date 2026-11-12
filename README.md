# CekRef

Sistem verifikasi keaslian daftar pustaka berbasis pencocokan metadata untuk literasi sumber ilmiah mahasiswa.

Mahasiswa menempelkan daftar pustaka (APA 7 / IEEE), lalu CekRef memecah tiap entri, mencocokkannya ke Crossref, dan memberi status **Cocok**, **Cocok Sebagian**, atau **Tidak Ditemukan di Database**.

> Status proyek: **Fase 0 (setup)**. Belum ada fitur yang berjalan.

## Prasyarat

- Node.js 20.19 atau lebih baru (dikembangkan dengan Node 24)
- npm 10 atau lebih baru
- Git

## Cara menjalankan

1. Pasang dependensi (otomatis juga menjalankan `prisma generate`):

   ```bash
   npm install
   ```

2. Salin file konfigurasi, lalu isi `CROSSREF_MAILTO` dengan email aktif:

   ```bash
   cp .env.example .env
   ```

3. Jalankan server pengembangan, lalu buka <http://localhost:3000>:

   ```bash
   npm run dev
   ```

## Perintah yang tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` / `npm start` | Build dan jalankan versi produksi |
| `npm test` | Jalankan semua test (Vitest) sekali |
| `npm run test:watch` | Jalankan test terus-menerus saat file berubah |
| `npm run lint` | Periksa gaya kode (ESLint) |
| `npm run typecheck` | Periksa tipe TypeScript |
| `npm run db:generate` | Buat ulang Prisma Client setelah `schema.prisma` berubah |
| `npm run db:migrate` | Terapkan perubahan skema ke database SQLite lokal |

## Variabel lingkungan

| Nama | Keterangan |
|---|---|
| `DATABASE_URL` | Lokasi file SQLite, default `file:./dev.db` |
| `CROSSREF_MAILTO` | Email untuk polite pool Crossref |
| `DEMO_MODE` | `true` = hanya baca cache, tanpa internet |

## Struktur folder

```
src/
  app/            Halaman Next.js (App Router)
  engine/         Inti pengecekan: splitter, parser, normalizer, similarity, matcher, classifier
  lib/            crossref.ts (klien Crossref), db.ts (Prisma client)
  config.ts       Bobot, ambang, dan TITLE_METHOD
  generated/      Prisma Client hasil generate (tidak di-commit)
prisma/           schema.prisma dan migrasi
tests/
  engine/         Unit test engine
  fixtures/       Contoh referensi untuk test
data/             Set uji evaluasi (testset.json)
content/          Materi edukasi dan soal pre/post-test
demo/             Skenario demo
reports/          Hasil `npm run eval` (tidak di-commit)
docs/             DECISIONS.md dan dokumentasi arsitektur
```

## Teknologi

Next.js (App Router) + TypeScript, Tailwind CSS, Prisma 7 + SQLite (adapter libSQL), Vitest.

Spesifikasi lengkap ada di [CLAUDE.md](CLAUDE.md), rencana per fase di [PROMPTS.md](PROMPTS.md), dan catatan keputusan di [docs/DECISIONS.md](docs/DECISIONS.md).
