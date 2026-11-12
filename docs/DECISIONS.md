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
