# CekRef — Spesifikasi Proyek

> File ini dibaca otomatis oleh Claude Code di setiap sesi. Jangan hapus. Perbarui bila ada keputusan baru.

## 1. Ringkasan

**CekRef: Sistem Verifikasi Keaslian Daftar Pustaka Berbasis Pencocokan Metadata untuk Literasi Sumber Ilmiah Mahasiswa.**

Aplikasi web tempat mahasiswa menempelkan daftar pustaka (APA 7 / IEEE). Sistem memecah tiap entri, mencocokkannya ke Crossref, lalu memberi status **Cocok**, **Cocok Sebagian**, atau **Tidak Ditemukan di Database** beserta perbandingan per field dan penjelasan edukatif.

Konteks: capstone mata kuliah Literasi Digital, prodi Teknik Informatika, dikerjakan perorangan (1 orang), waktu < 4 minggu. Penilaian menekankan **demo yang berjalan mulus** serta **dokumentasi & proses** (Git, testing, arsitektur). Komponen inti (parser, algoritma kemiripan, skor) **harus ditulis sendiri**, bukan memakai library siap pakai.

## 2. Prinsip yang tidak boleh dilanggar

1. **Jangan pernah melabeli referensi sebagai "palsu".** Label terendah adalah "Tidak Ditemukan di Database". Banyak jurnal Indonesia tidak punya DOI Crossref.
2. **Jalur utama harus deterministik.** Tidak ada LLM/AI API di jalur pengecekan utama.
3. **Demo tidak boleh bergantung pada internet.** Semua hasil Crossref di-cache; ada mode demo yang membaca dari cache saja.
4. **Algoritma inti ditulis sendiri** (parser, normalisasi, Jaro-Winkler, Jaccard, skor). Boleh library untuk hal umum (framework, ORM, UI, testing, hashing password).
5. **Setiap fungsi inti wajib punya unit test** sebelum dipakai UI.
6. **Jangan menambah fitur di luar Bagian 5** tanpa diminta.
7. Teks antarmuka berbahasa **Indonesia**. Kode, nama variabel, dan komentar dalam bahasa Inggris.

## 3. Tech stack

> GANTI bagian ini bila tim lebih menguasai stack lain (misalnya Laravel), lalu beri tahu Claude Code.

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite (file lokal, mudah untuk demo)
- Vitest untuk unit & integration test
- Autentikasi sederhana: email + password (bcrypt), session cookie httpOnly
- Konfigurasi lewat `.env` (`CROSSREF_MAILTO`, `DATABASE_URL`, `DEMO_MODE`)

## 4. Arsitektur engine

```
input teks
 → splitter      : pisahkan daftar menjadi entri (baris kosong / penomoran [1] / 1.)
 → parser        : deteksi gaya (APA/IEEE) → { authors[], year, title, venue, doi, raw }
 → normalizer    : lowercase, hapus tanda baca & diakritik, rapikan spasi, normalisasi nama penulis
 → lookup        : (a) jika ada DOI → GET /works/{doi}
                   (b) jika tidak / DOI gagal → GET /works?query.bibliographic=<raw>&rows=5
                   cek cache dulu; simpan respons ke cache
 → matcher       : bandingkan field input vs tiap kandidat, pilih skor tertinggi
 → classifier    : terapkan aturan & ambang → label + daftar alasan
```

Struktur folder yang diharapkan: `src/engine/{splitter,parser,normalizer,similarity,matcher,classifier}.ts`, `src/lib/crossref.ts`, test di `tests/engine/`.

### Similarity (tulis sendiri)
- `jaroWinkler(a, b)` → 0..1
- `jaccardTokens(a, b)` → 0..1 (token kata setelah normalisasi)
- Skor judul memakai metode yang dipilih lewat config (`TITLE_METHOD = "jw" | "jaccard"`) agar keduanya bisa dibandingkan saat evaluasi.

### Skor berbobot (nilai awal, disetel ulang saat evaluasi)
| Field | Bobot | Cara hitung |
|---|---|---|
| Judul | 0.50 | similarity judul |
| Penulis | 0.25 | proporsi nama belakang penulis input yang ada di kandidat |
| Tahun | 0.15 | 1 jika sama, 0.5 jika selisih 1, else 0 |
| Venue | 0.10 | similarity nama jurnal/konferensi |

Field yang kosong di input → bobotnya dibagi ulang ke field lain.

### Aturan label (ambang di file config, bukan hard-code)
- **Cocok**: skor ≥ 0.85
- **Cocok Sebagian**: 0.60 ≤ skor < 0.85, ATAU DOI valid tetapi judul mirip < 0.60 (alasan: "DOI mengarah ke artikel lain")
- **Tidak Ditemukan di Database**: skor < 0.60 atau tidak ada kandidat

Setiap hasil menyertakan `reasons[]` berbahasa Indonesia, mis. "Tahun berbeda (input 2021, database 2020)".

### Crossref
- Base URL `https://api.crossref.org`; sertakan `mailto` dari env (polite pool).
- Batasi konkurensi ≤ 3, timeout 8 detik, retry 1x dengan backoff; hormati header `x-rate-limit-*`.
- Tabel cache: kunci = DOI atau hash query; simpan JSON respons + waktu.

## 5. Lingkup fitur

### Wajib (MVP)
1. Halaman Cek: textarea → tombol Periksa → tabel hasil per entri (label berwarna, skor, alasan).
2. Detail entri: perbandingan field input vs database + tautan DOI.
3. Hasil parsing bisa dikoreksi pengguna lalu dicek ulang.
4. Halaman Edukasi: kenapa AI bisa mengarang sitasi + 3 langkah verifikasi manual.
5. Pre-test & post-test (10 soal: tandai referensi asli/bermasalah), skor tersimpan.
6. Login sederhana + riwayat pengecekan.
7. `DEMO_MODE=true` → hanya baca cache, tanpa panggilan jaringan.
8. Skrip evaluasi `npm run eval` (lihat Bagian 6).

### Tambahan (hanya bila MVP selesai & lolos test)
- Upload .docx → ekstrak bagian daftar pustaka
- Mode latihan "Asli atau Karangan?"
- Ekspor laporan PDF

## 6. Evaluasi

- Set uji di `data/testset.json`: `[{ raw, label: "real" | "problematic", source }]`. **Diisi manual oleh pengembang** (referensi asli diambil dari jurnal sungguhan termasuk SINTA; referensi bermasalah dari ChatGPT yang sudah dicek manual). Claude Code tidak boleh mengarang isi set uji.
- `npm run eval` menghitung precision, recall, F1 (kelas positif = bermasalah, yakni label selain Cocok), confusion matrix, rata-rata waktu per entri, untuk kedua `TITLE_METHOD`. Output ke `reports/eval-<tanggal>.md`.

## 7. Keamanan & privasi

- Password di-hash bcrypt; session cookie httpOnly + sameSite.
- Validasi & batasi input (maks 50 entri / 20.000 karakter per pengecekan).
- Simpan data seminimal mungkin: email, hash password, riwayat cek, skor tes. Tidak ada nama lengkap / NIM kecuali diperlukan.
- Rahasia hanya di `.env`; `.env` masuk `.gitignore`, sediakan `.env.example`.

## 8. Cara kerja dengan Claude Code

- Kerjakan **satu fase per sesi**, sesuai urutan di `PROMPTS.md`.
- Sebelum menulis kode fase baru, tuliskan rencana singkat dan tunggu persetujuan.
- Setelah selesai: jalankan `npm test`, laporkan hasilnya, commit dengan pesan konvensional (`feat:`, `fix:`, `test:`, `docs:`).
- Catat keputusan penting di `docs/DECISIONS.md` (tanggal, keputusan, alasan) — dipakai untuk laporan.

## 9. Catatan Next.js

Next.js di proyek ini (v16) punya perubahan besar dibanding versi lama. Ikuti aturan di AGENTS.md:

@AGENTS.md
