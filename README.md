# CekRef

Sistem verifikasi keaslian daftar pustaka berbasis pencocokan metadata untuk literasi sumber ilmiah mahasiswa.

Mahasiswa menempelkan daftar pustaka (APA 7 / IEEE), lalu CekRef memecah tiap entri, mencocokkannya ke Crossref, dan memberi status **Cocok**, **Cocok Sebagian**, atau **Tidak Ditemukan di Database**.

> Status proyek: **Fase 2 selesai** (engine lengkap + Crossref + cache + `DEMO_MODE`, bisa dicoba lewat `npm run check`). Antarmuka web belum tersedia.
>
> Anggota tim baru: mulai dari [docs/PANDUAN-TIM.md](docs/PANDUAN-TIM.md).

## Prasyarat

- Node.js 24 LTS (minimal 22.12, syarat Vitest 5)
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

3. Buat database SQLite lokal (ulangi setiap ada migrasi baru setelah `git pull`):

   ```bash
   npm run db:migrate
   ```

4. Jalankan server pengembangan, lalu buka <http://localhost:3000>:

   ```bash
   npm run dev
   ```

## Mencoba pengecekan dari terminal

Periksa daftar pustaka di sebuah file teks (satu referensi per baris, dipisah baris kosong, atau bernomor `[1]`/`1.`):

```bash
npm run check -- tests/fixtures/references.txt
```

Hasilnya label (Cocok / Cocok Sebagian / Tidak Ditemukan di Database), skor, dan alasan per entri. Respons Crossref disimpan di cache `dev.db`, jadi pemeriksaan kedua bisa dijalankan tanpa internet dengan `DEMO_MODE=true` di `.env`.

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
| `npm run check -- <file.txt>` | Periksa daftar pustaka dari terminal |
| `npm run crossref:record` | Rekam ulang respons Crossref untuk fixture test (perlu internet) |

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
  engine/         Inti pengecekan: splitter, parser, normalizer, similarity, matcher, classifier, check (pipeline)
  lib/            crossref.ts (klien Crossref), cache.ts, limiter.ts, db.ts (Prisma client)
  config.ts       Bobot, ambang, dan TITLE_METHOD
  generated/      Prisma Client hasil generate (tidak di-commit)
prisma/           schema.prisma dan migrasi
scripts/          CLI npm run check dan perekam fixture Crossref
tests/
  engine/, lib/   Unit test
  integration/    Test end-to-end (offline, memakai rekaman Crossref)
  fixtures/       Contoh referensi asli + rekaman respons Crossref
data/             Set uji evaluasi (testset.json)
content/          Materi edukasi dan soal pre/post-test
demo/             Skenario demo
reports/          Hasil `npm run eval` (tidak di-commit)
docs/             DECISIONS.md dan dokumentasi arsitektur
```

## Teknologi

Next.js (App Router) + TypeScript, Tailwind CSS, Prisma 7 + SQLite (adapter libSQL), Vitest.

Spesifikasi lengkap ada di [CLAUDE.md](CLAUDE.md), rencana per fase di [PROMPTS.md](PROMPTS.md), dan catatan keputusan di [docs/DECISIONS.md](docs/DECISIONS.md).
