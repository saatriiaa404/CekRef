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

## 2026-11-12 — Fase 1: aturan splitter

- **Keputusan:** Urutan aturan pemecah daftar: penanda `[n]` → penomoran `n.` (maks. 3 digit) → baris kosong → satu baris satu entri. Baris yang terpotong di dalam entri disambung kembali.
- **Alasan:** Penomoran adalah petunjuk paling tegas. Batas 3 digit mencegah baris lanjutan yang diawali tahun (mis. "2015.") terbaca sebagai nomor. Keterbatasan: daftar tanpa nomor dan tanpa baris kosong yang entrinya terpotong ke beberapa baris akan terpecah per baris.

## 2026-11-12 — Fase 1: heuristik parser APA & IEEE

- **Keputusan:** Gaya dideteksi dari tahun dalam kurung (APA) atau judul dalam tanda kutip (IEEE), mana yang muncul lebih dulu; selain itu `unknown` (DOI tetap diambil, tidak pernah throw).
  - APA: inisial ditempelkan ke nama sebelumnya, sehingga nama satu kata ("Sudiran, & Hartono") dan penulis lembaga tetap utuh. Venue berhenti di ", <angka>" atau ", Article" agar nama jurnal yang mengandung koma tidak terpotong.
  - IEEE: nama belakang = kata terakhir tiap nama. Tahun diambil dari segmen yang hanya berisi tahun atau bulan + tahun, bukan "angka 4 digit terakhir", agar halaman "1877–1901" tidak terbaca sebagai tahun 1901.
- **Alasan:** Diuji pada 15 referensi asli di `tests/fixtures/`. Keterbatasan yang diketahui: judul APA yang mengandung singkatan bertitik (mis. "U.S.") akan terpotong; nama belakang IEEE yang terdiri dari dua kata (mis. "van der Berg") hanya terambil kata terakhirnya.

## 2026-11-12 — Fase 1: parameter similarity dan normalisasi

- **Keputusan:** Jaro-Winkler standar (skala awalan 0.1, awalan maks. 4, tanpa ambang boost). Jaccard dihitung atas himpunan token setelah normalisasi. Normalizer memakai peta khusus untuk huruf yang tidak terurai lewat Unicode NFKD (Đ, Ł, ø, ß, æ, œ, ı) dan mendekode entitas HTML.
- **Alasan:** Parameter standar memberi nilai yang cocok dengan contoh di literatur (MARTHA/MARHTA = 0.961) sehingga mudah dipertanggungjawabkan. Peta khusus diperlukan karena Crossref menyimpan "Đức" sebagai "Duc" dan nama jurnal sebagai "Computers &amp; Education".

## 2026-11-12 — Fase 1: perbaikan tiga keterbatasan

Memperbarui keterbatasan yang dicatat pada dua entri di atas.

- **Keputusan:**
  - **Judul APA:** titik tidak dianggap akhir judul bila kata sebelumnya berupa huruf kapital tunggal atau singkatan bertitik (`U.S.`, `A.I.`), atau singkatan umum (`e.g.`, `i.e.`, `vs.`, `etc.`, `et al.`, `cf.`, `Dr.`, `St.`, `No.`, `Vol.`).
  - **Nama IEEE:** inisial di depan dibuang dulu. Nama belakang dimulai dari partikel pertama yang ditulis huruf kecil (`van`, `der`, `de`, `bin`, `binti`, `al`, dst.); bila tidak ada partikel, nama belakang adalah kata terakhir. Partikel bertulisan kapital tidak dihitung, agar nama depan seperti "Di" pada "Di Wang" tidak salah tafsir.
  - **Splitter tanpa pemisah:** baris dianggap awal entri baru bila diawali `Nama, X.` (boleh didahului partikel), memuat tahun APA dalam 150 karakter pertama, atau diawali inisial IEEE dan memuat judul bertanda kutip. Baris lain disambung ke entri sebelumnya. Bila tak satu baris pun cocok, tetap satu baris satu entri.
- **Alasan:** Ketiganya realistis pada daftar pustaka mahasiswa yang disalin dari Word. Sisa keterbatasan: judul yang benar-benar diakhiri satu huruf (mis. "…vitamin C. Journal…") akan salah potong; daftar IEEE tanpa nomor yang daftar penulisnya terpotong ke baris berikutnya bisa terbelah. Keduanya jarang, dan daftar IEEE hampir selalu bernomor `[n]`.

## 2026-11-13 — Kembali menjadi tim 2 orang

Menggantikan keputusan "Proyek dikerjakan perorangan" (2026-11-12).

- **Keputusan:** Mata kuliah tetap mewajibkan tim 2 orang. Anggota A mengerjakan Fase 0–1 dan selanjutnya engine, Crossref, serta evaluasi; Anggota B bergabung mulai Fase 2 dan mengerjakan login, riwayat, edukasi, pre/post-test, lalu UI. Testset dikumpulkan separuh-separuh. Rincian di `docs/PANDUAN-TIM.md`.
- **Alasan:** Riwayat Git Fase 0–1 dibiarkan apa adanya karena mencerminkan siapa yang benar-benar mengerjakan. Mulai Fase 2, setiap anggota commit dari akunnya sendiri lewat branch dan Pull Request yang di-review anggota lain, supaya kontribusi masing-masing terlihat jelas.

## 2026-11-13 — Syarat Node.js 22.12+ (disarankan 24 LTS)

- **Keputusan:** README dan panduan tim mensyaratkan Node.js 22.12 atau lebih baru, disarankan 24 LTS.
- **Alasan:** Vitest 5 hanya mendukung Node `^22.12.0 || ^24.0.0 || >=26.0.0`. README sebelumnya keliru menulis 20.19.

## 2026-11-22 — Fase 2: bentuk data hasil pengecekan (CheckResult)

- **Keputusan:** Tipe bersama di `src/engine/types.ts`: `label` (`match` / `partial` / `not_found`, diterjemahkan ke teks Indonesia lewat `LABEL_TEXT`), `score`, `reasons[]`, `best` (kandidat Crossref terbaik), `fields[]` (perbandingan per field untuk halaman Detail), `lookup` (`doi` / `search` / `none`), dan `fromCache`. Diajukan lewat draft PR #3 untuk di-review Anggota B.
- **Alasan:** Halaman Cek, Detail, dan Riwayat (Fase 3–4) membutuhkan bentuk yang sama; kode memakai nilai bahasa Inggris, teks yang tampil berbahasa Indonesia (CLAUDE.md Bagian 2 butir 7).

## 2026-11-22 — Fase 2: aturan skor yang diperluas dari CLAUDE.md

- **Keputusan:**
  - Field yang kosong **di input atau di Crossref** tidak dinilai, dan bobotnya dibagi ulang ke field lain. CLAUDE.md hanya menyebut field kosong di input.
  - Nama belakang penulis dianggap ada di kandidat bila sama setelah normalisasi **atau** salah satunya merupakan bagian kata dari yang lain ("Son" vs Crossref "Ngoc Son").
  - Venue dibandingkan dengan metode yang sama dengan judul (`TITLE_METHOD`).
  - Field dengan kemiripan di bawah `thresholds.fieldMismatch` (0.85) mendapat alasan tersendiri.
- **Alasan:** Data Crossref sering tidak lengkap atau berbeda penulisan (lihat `tests/fixtures/references-sources.md`). Kekurangan data di Crossref bukan kesalahan pengguna, jadi tidak boleh menurunkan skor.

## 2026-11-22 — Fase 2: klien Crossref dan cache

- **Keputusan:** Satu jalur lookup untuk DOI dan pencarian: cek cache → (bila `DEMO_MODE` mati) panggil Crossref dengan maksimal 3 permintaan bersamaan, timeout 8 detik, retry 1x dengan backoff untuk error jaringan/429/5xx, dan jarak antar-permintaan dari header `x-rate-limit-*`. Respons 200 **dan 404** disimpan di tabel `CrossrefCache` (kunci `doi:<doi>` atau `query:<sha256>`). DOI yang tidak dikenal Crossref dilanjutkan ke pencarian. Pembatas permintaan (`src/lib/limiter.ts`) ditulis sendiri.
- **Alasan:** Menyimpan 404 membuat demo konsisten tanpa internet. `fetch` dan cache disuntikkan sehingga semua unit test berjalan tanpa jaringan. Kegagalan jaringan dilaporkan sebagai "Crossref tidak dapat dihubungi", bukan sebagai referensi bermasalah.

## 2026-11-22 — Fase 2: pipeline `check.ts` dan CLI

- **Keputusan:** `src/engine/check.ts` (tambahan di luar daftar file CLAUDE.md) menyatukan splitter → parser → lookup → matcher → classifier. `checkReferences` memberi callback progres untuk UI Fase 3; `checkParsed` dipakai untuk cek ulang setelah koreksi pengguna. Query pencarian disusun dari field hasil parsing (judul, nama penulis, venue, tahun); teks mentah dipakai bila judul tidak terbaca. CLI `npm run check -- file.txt` memakai `tsx`.
- **Alasan:** Fase 3 butuh satu fungsi yang bisa dipanggil halaman Cek. Query dari field membuat hasil koreksi pengguna ikut memengaruhi pencarian.

## 2026-11-22 — Fase 2: integration test memakai rekaman Crossref asli

- **Keputusan:** Respons Crossref untuk 15 referensi fixture direkam sekali (`npm run crossref:record`, tanpa email kontak) ke `tests/fixtures/crossref/cache.json`. Integration test menjalankan pipeline end-to-end dalam `DEMO_MODE`, jadi tidak pernah memakai internet.
- **Alasan:** Menguji pada data Crossref sungguhan, termasuk ketidakrapiannya, tetapi tetap cepat dan stabil.
- **Temuan awal untuk Fase 5:** ke-11 referensi ber-DOI selalu **Cocok** (skor 1.0) dengan kedua metode. Untuk entri 5 (JES, tidak terindeks) dan 12 (halaman WHO), Crossref mengembalikan artikel *lain* yang judulnya mirip: Jaro-Winkler menilainya **Cocok Sebagian** (0.82 dan 0.62), sedangkan Jaccard menolaknya (**Tidak Ditemukan**). Ini indikasi awal bahwa bonus awalan Jaro-Winkler rawan salah positif pada judul panjang. Bobot dan ambang sengaja **tidak** diubah; keputusan dibuat di Fase 5 berdasarkan testset.
