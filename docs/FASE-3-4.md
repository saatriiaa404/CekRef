# Panduan Fase 4 dan Fase 3

Untuk Anggota B. Dokumen ini menjelaskan **apa yang dibuat, aturan yang wajib diikuti, cara memecahnya menjadi Pull Request, dan kapan fase dianggap selesai**.

Rancangan tampilan setiap halaman ada di [UI.md](UI.md).

Sumber aturan: [CLAUDE.md](../CLAUDE.md) Bagian 5 dan 7, serta [PROMPTS.md](../PROMPTS.md). Hal yang belum diputuskan ditandai **(sepakati bersama)**. Hasil kesepakatannya dicatat di [DECISIONS.md](DECISIONS.md).

> Sebelum menulis kode Next.js, baca dokumentasi di `node_modules/next/dist/docs/` (lihat `AGENTS.md`). Proyek ini memakai Next.js 16, dan banyak cara lama sudah berubah.

## Kenapa Fase 4 dulu, baru Fase 3?

- **Fase 4** (akun, edukasi, tes) **tidak butuh engine pengecekan**, jadi bisa dikerjakan sekarang, bersamaan dengan Fase 2 milik Anggota A.
- **Fase 3** (halaman Cek & Detail) **menampilkan hasil engine**, jadi baru dikerjakan setelah Fase 2 selesai.

---

## FASE 4 — Akun, Riwayat, Edukasi, Pre/Post-test

**Tujuan:** pengguna punya akun, belajar cara memverifikasi referensi, dan kemajuannya **terukur** lewat pre-test dan post-test. Bagian inilah yang membuat CekRef menjadi alat *edukasi*, bukan sekadar alat cek.

### 4.1 Login sederhana

- Halaman **Daftar** (email + password), **Masuk**, dan tombol **Keluar**.
- Password **di-hash dengan bcrypt** sebelum disimpan. Password asli tidak pernah disimpan.
- Setelah masuk, server membuat **session** yang disimpan di **cookie `httpOnly` + `sameSite`**.
  - `httpOnly`: cookie tidak bisa dibaca JavaScript di browser, sehingga lebih aman dari pencurian lewat skrip (XSS).
  - `sameSite`: situs lain tidak bisa memakai cookie ini.
- Halaman yang butuh login (Riwayat, Tes) mengarahkan pengguna ke halaman Masuk bila belum login.
- Data yang disimpan **hanya email dan hash password**. Jangan menyimpan nama lengkap atau NIM (CLAUDE.md Bagian 7).
- Pesan error login dibuat **umum**, yaitu "Email atau password salah", supaya tidak membocorkan email mana yang terdaftar.
- Password minimal 8 karakter.

### 4.2 Halaman Edukasi

Isinya (CLAUDE.md Bagian 5 butir 4):

1. **Kenapa AI bisa mengarang sitasi.** AI menyusun teks yang *terdengar* benar berdasarkan pola, bukan mencari di database. Hasilnya bisa berupa penulis, judul, dan jurnal yang masuk akal tapi tidak pernah ada.
2. **Tiga langkah verifikasi manual**, misalnya: cek DOI di doi.org, cari judulnya di Google Scholar atau situs jurnal, lalu cocokkan penulis dan tahunnya.

**Materi ditulis sendiri oleh tim di folder `content/`**, bukan dibuat AI. Kode hanya menampilkan isi file tersebut.

### 4.3 Pre-test dan Post-test

- **Pre-test** dikerjakan **sebelum** belajar. **Post-test** dikerjakan **setelah** membaca Edukasi dan mencoba CekRef.
- **10 soal.** Setiap soal menampilkan satu referensi, dan pengguna memilih **Asli** atau **Bermasalah**.
- Skor = jumlah jawaban benar, **disimpan per pengguna**.
- **Isi soal ditulis sendiri oleh tim** di `content/`:
  - Soal "asli" memakai referensi sungguhan.
  - Soal "bermasalah" memakai referensi buatan ChatGPT yang sudah dicek manual memang tidak ada atau datanya salah.
  - Sertakan kunci jawaban dan penjelasan singkat untuk setiap soal.
- **Halaman ringkasan admin:** rata-rata skor pre-test vs post-test dari semua pengguna. Angka ini menjadi **bukti di laporan** bahwa aplikasi meningkatkan literasi.

**(Sepakati bersama):**
- Apakah pre-test hanya boleh dikerjakan sekali?
- Apakah post-test baru terbuka setelah pre-test selesai?
- Bagaimana menentukan admin? Usulan: kolom `role` di tabel `User`, di-set lewat data awal.

### 4.4 Riwayat pengecekan

- Daftar pengecekan milik pengguna: tanggal, jumlah entri, dan ringkasan per label (mis. 5 Cocok, 2 Sebagian, 1 Tidak Ditemukan). Klik satu baris untuk melihat hasil lengkapnya.
- **Ketergantungan:** isinya berasal dari hasil Fase 2 (tipe `CheckResult`). Di Fase 4 cukup siapkan **tabel dan halamannya**. Bagian menyimpan hasil cek disambungkan di Fase 3.

### 4.5 Database (Prisma)

Usulan tabel **(sepakati bersama)**, karena `prisma/schema.prisma` dipakai kedua anggota:

| Tabel | Isi |
|---|---|
| `User` | id, email (unik), passwordHash, role, createdAt |
| `Session` | id/token, userId, expiresAt |
| `CheckHistory` | id, userId, createdAt, jumlah entri, hasil (JSON) |
| `TestScore` | id, userId, jenis (`pre`/`post`), skor, createdAt |

Tabel `Cache` untuk Crossref dibuat Anggota A di Fase 2. **Kabari satu sama lain sebelum mengubah file schema.**

### 4.6 Keamanan (CLAUDE.md Bagian 7)

- Pakai bcrypt dan cookie `httpOnly` + `sameSite`, seperti di atas.
- **Fungsi validasi input**: maksimal **50 entri / 20.000 karakter** per pengecekan. Fungsinya dibuat di Fase 4 dan dipakai halaman Cek di Fase 3.
- Rahasia hanya disimpan di `.env`.
- **Jangan menambah fitur di luar lingkup** (CLAUDE.md Bagian 2 butir 6), misalnya lupa password, login Google, atau foto profil.

### 4.7 Urutan Pull Request yang disarankan

1. `feat/auth`: tabel `User` dan `Session`, daftar/masuk/keluar, beserta test.
2. `feat/edukasi`: halaman Edukasi dan materi di `content/`.
3. `feat/tes`: pre/post-test, simpan skor, ringkasan admin, beserta test penilaian.
4. `feat/riwayat`: tabel `CheckHistory` dan halaman Riwayat (masih kosong).

### 4.8 Test yang wajib ada

- Hash dan cek password.
- Validasi session (kedaluwarsa atau tidak valid).
- Perhitungan skor tes.
- Validasi batas input 50 entri / 20.000 karakter.

### ✅ Fase 4 selesai bila

- [ ] Bisa daftar, masuk, dan keluar. Password tersimpan sebagai hash.
- [ ] Halaman Edukasi tampil dari isi `content/`.
- [ ] Pre-test dan post-test bisa dikerjakan, dan skornya tersimpan per pengguna.
- [ ] Halaman admin menampilkan rata-rata skor pre vs post.
- [ ] Halaman Riwayat ada (boleh masih kosong).
- [ ] `npm test` lulus, dan semua PR sudah di-review.

---

## FASE 3 — Halaman Cek dan Detail

**Tujuan:** inilah wajah aplikasi yang **didemokan**. Pengguna menempelkan daftar pustaka, lalu melihat hasilnya dengan jelas.

**Prasyarat:** Fase 2 selesai, sehingga ada fungsi yang menerima teks daftar pustaka dan mengembalikan hasil per entri.

### 3.1 Halaman Cek

1. **Textarea** untuk menempelkan daftar pustaka, dengan tombol **Periksa**.
2. Validasi input (maks. 50 entri / 20.000 karakter). Bila lewat batas, tampilkan pesan yang jelas dalam bahasa Indonesia.
3. Selama pengecekan berjalan, tampilkan **progres**, mis. *"Memeriksa 3 dari 12 referensi…"*, karena pencarian ke Crossref bisa memakan beberapa detik per referensi.
4. **Tabel hasil** dengan kolom: No, ringkasan referensi, **Label**, **Skor**, **Alasan**.

| Label | Warna |
|---|---|
| Cocok | **Hijau** |
| Cocok Sebagian | **Kuning** |
| Tidak Ditemukan di Database | **Abu-abu** |

- **Jangan pakai merah, dan jangan pernah menulis kata "palsu"**, karena "tidak ditemukan" bukan berarti palsu.
- Tulis **teks labelnya juga**, jangan hanya warna, supaya tetap terbaca oleh pengguna buta warna.

### 3.2 Halaman Detail entri

Terbuka saat satu baris di tabel diklik:

- **Tabel perbandingan** "yang ditulis pengguna" vs "yang ada di database" untuk Penulis, Tahun, Judul, Venue, dan DOI. Field yang berbeda **disorot**.
- **Tautan DOI** ke `https://doi.org/<doi>`, supaya pengguna bisa mengecek sendiri, sejalan dengan materi Edukasi.
- Daftar **alasan** dari classifier.

### 3.3 Koreksi hasil parsing lalu cek ulang

CLAUDE.md Bagian 5 butir 3:

- Parser kadang salah membaca, misalnya judul terpotong. Di halaman Detail, tampilkan **form berisi hasil parsing** (penulis, tahun, judul, venue, DOI).
- Pengguna **mengedit** field yang salah, lalu menekan **Cek ulang**. Sistem mencocokkan lagi memakai data yang sudah dikoreksi, tanpa mem-parsing ulang.
- Bentuk fungsi "cek ulang dari data yang sudah diparsing" **(disepakati dengan Anggota A)** saat menentukan `CheckResult` di awal Fase 2.

### 3.4 Menyambungkan ke Riwayat

Setiap pengecekan oleh pengguna yang sudah login **disimpan** ke tabel `CheckHistory`, sehingga halaman Riwayat terisi.

### 3.5 Keadaan khusus

- **Input kosong:** tombol Periksa tidak aktif, atau muncul pesan.
- **Crossref tidak bisa dihubungi:** pesan yang ramah, bukan halaman crash.
- **`DEMO_MODE=true`:** tetap jalan tanpa internet, karena data dibaca dari cache.

### 3.6 Urutan Pull Request yang disarankan

1. `feat/halaman-cek`: textarea, validasi, progres, tabel hasil.
2. `feat/halaman-detail`: perbandingan field dan tautan DOI.
3. `feat/koreksi-cek-ulang`: form edit dan cek ulang.
4. `feat/simpan-riwayat`: simpan hasil ke Riwayat.

### ✅ Fase 3 selesai bila

- [ ] Menempelkan daftar → Periksa → tabel hasil dengan label berwarna, skor, dan alasan.
- [ ] Ada indikator progres selama pengecekan.
- [ ] Halaman Detail menampilkan perbandingan field dan tautan DOI.
- [ ] Hasil parsing bisa diedit lalu dicek ulang.
- [ ] Hasil tersimpan ke Riwayat.
- [ ] Tidak ada merah dan tidak ada kata "palsu". Semua teks berbahasa Indonesia.
- [ ] Semua berjalan juga dengan `DEMO_MODE=true`.

---

## Pertanyaan dosen yang mungkin diajukan

| Pertanyaan | Inti jawaban |
|---|---|
| Kenapa password tidak disimpan langsung? | Kalau database bocor, password asli ikut bocor. Hash bcrypt tidak bisa dibalik. |
| Apa fungsi `httpOnly` pada cookie? | Mencegah JavaScript membaca cookie session, sehingga lebih aman dari XSS. |
| Bagaimana membuktikan aplikasi ini mendidik? | Bandingkan rata-rata skor pre-test vs post-test. |
| Kenapa labelnya abu-abu, bukan merah? | "Tidak ditemukan" bukan berarti palsu. Banyak jurnal asli tidak ada di Crossref. |
| Siapa yang membuat soal tes? | Tim sendiri. Referensi asli dari jurnal sungguhan, referensi bermasalah sudah dicek manual. |
