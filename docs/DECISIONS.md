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

## 2026-11-27 — Fase 4: autentikasi, edukasi, tes, riwayat

### Session token

- **Keputusan:** Token sesi adalah string acak 32-byte (base64url) yang dikirim ke browser lewat cookie. Yang disimpan di database adalah SHA-256-hash dari token tersebut (kolom `tokenHash`), bukan token aslinya.
- **Alasan:** Jika database bocor, penyerang tidak dapat langsung menggunakan nilai yang tersimpan sebagai cookie — mereka harus menemukan pra-gambar SHA-256. Pendekatan ini tidak memerlukan secret eksternal sehingga `.env` tidak perlu variabel tambahan.

### Cookie sesi

- **Keputusan:** `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `maxAge: 7 hari`. Flag `secure` hanya di-set di production (`NODE_ENV === "production"`).
- **Alasan:** `httpOnly` mencegah pembacaan lewat JavaScript. `sameSite: "lax"` cukup untuk aplikasi web biasa (tanpa kebutuhan cross-site POST). `secure` dimatikan di development agar bisa dicoba di `http://localhost`.

### Data yang disimpan

- **Keputusan:** Tabel `User` hanya menyimpan `email` (dalam huruf kecil) dan `passwordHash` (bcrypt). Tidak ada nama, NIM, foto profil, atau data pribadi lain.
- **Alasan:** Prinsip minimal data sesuai CLAUDE.md. Email dinormalisasi (huruf kecil, tanpa spasi) sebelum disimpan dan sebelum pengecekan login.

### Role admin

- **Keputusan:** Kolom `role` di tabel `User`, nilai `"user"` (default) atau `"admin"`. Akun admin dibuat/diperbarui lewat `npm run seed:admin <email> <password>` (tidak ada pendaftaran admin lewat UI).
- **Alasan:** Halaman `/admin` hanya perlu satu level tambahan di atas user biasa. Tidak ada UI manajemen pengguna agar lingkup tetap minimal.

### Pre-test vs post-test

- **Keputusan:** Pre-test dan post-test menggunakan soal yang sama (`content/soal.json`). Pre-test hanya menampilkan skor total; post-test menampilkan skor + perbandingan dengan pre-test + pembahasan jawaban benar.
- **Alasan:** Desain quasi-eksperimen: soal sama memudahkan perbandingan skor. Pembahasan di post-test memberi nilai edukasi tambahan.

### Penyimpanan skor

- **Keputusan:** `TestScore` menyimpan setiap pengiriman tes (pre/post bisa diulang). Untuk pre-test, skor yang ditampilkan adalah skor pertama; untuk post-test, skor yang ditampilkan adalah skor terbaru. Halaman admin menampilkan rata-rata seluruh pengguna.
- **Alasan:** Menyimpan semua sesi memungkinkan analisis lebih lanjut tanpa mengubah skema. Aturan "pre = pertama, post = terbaru" mencerminkan logika quasi-eksperimen paling sederhana.

### Jumlah soal

- **Keputusan:** 10 soal per tes (sesuai FASE-3-4.md §4.3). Tiap soal menampilkan satu referensi; pengguna memilih "Asli" atau "Bermasalah".
- **Alasan:** 10 soal cukup untuk mengukur pemahaman awal vs. akhir tanpa terlalu lama.

### Halaman riwayat — panel detail inline

- **Keputusan:** Detail tiap referensi dalam riwayat ditampilkan sebagai panel yang bisa dibuka/ditutup di bawah baris tabel, bukan halaman terpisah.
- **Alasan:** Lebih cepat untuk menelusuri beberapa referensi sekaligus; menghindari navigasi bolak-balik.

### Soal tes — konten ditulis tim, bukan AI

- **Keputusan:** Soal di `content/soal.json` wajib di-review dan disetujui oleh anggota tim sebelum di-commit ke `main`.
- **Alasan:** CLAUDE.md melarang AI mengarang konten tes secara mandiri. Referensi fixture di `tests/fixtures/` dipakai sebagai bahan acuan, namun keputusan final ada di tangan tim.
