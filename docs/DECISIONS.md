# Catatan Keputusan

Format: tanggal — keputusan — alasan.

## 2026-11-12 — Proyek dikerjakan perorangan

- **Keputusan:** CekRef dikerjakan oleh satu orang, bukan tim dua orang seperti rencana awal.
- **Alasan:** Riwayat Git dan dokumentasi harus mencerminkan siapa yang benar-benar mengerjakan. Lingkup MVP tetap; fitur tambahan dikerjakan hanya bila waktu cukup.

## 2026-11-12 — Stack sesuai CLAUDE.md Bagian 3

- **Keputusan:** Next.js 16 (App Router) + TypeScript, Tailwind CSS 4, Prisma + SQLite, Vitest.
- **Alasan:** Satu bahasa (TypeScript) untuk UI, API, dan engine; SQLite berupa file lokal sehingga demo tidak butuh server database.

## 2026-11-12 — Prisma dikunci ke 7.10.1 dengan adapter libSQL

- **Keputusan:** `prisma`, `@prisma/client`, dan `@prisma/adapter-libsql` dipasang dengan versi persis 7.10.1.
- **Alasan:** Tag `latest` di npm saat setup menunjuk ke rilis kandidat 8.0.0-rc, yang terlalu berisiko untuk demo. Prisma 7 mewajibkan driver adapter; libSQL dipilih karena memakai binary siap pakai di Windows tanpa perlu kompilasi native (berbeda dengan better-sqlite3).

## 2026-11-12 — Vitest 5 dan @types/node 24

- **Keputusan:** Test memakai Vitest 5; `@types/node` dinaikkan ke versi 24.
- **Alasan:** Vitest 5 menolak `@types/node` 20 bawaan create-next-app; versi 24 juga cocok dengan Node yang dipakai di laptop pengembangan.

## 2026-11-12 — Line ending LF

- **Keputusan:** `.gitattributes` memaksa line ending LF untuk file teks.
- **Alasan:** Pengembangan di Windows; mencegah diff penuh perubahan CRLF/LF.
