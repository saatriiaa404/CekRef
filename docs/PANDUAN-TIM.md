# Panduan Tim CekRef

Dokumen ini untuk kedua anggota tim: apa proyeknya, sampai mana progresnya, siapa mengerjakan apa, cara menjalankan proyek di laptop sendiri, dan cara bekerja bersama di GitHub.

> Spesifikasi resmi tetap [CLAUDE.md](../CLAUDE.md). Bila panduan ini berbeda dengan CLAUDE.md, ikuti CLAUDE.md lalu perbarui panduan ini.

**Isi**
1. [Tentang proyek](#1-tentang-proyek)
2. [Status saat ini](#2-status-saat-ini)
3. [Pembagian tugas dan to-do](#3-pembagian-tugas-dan-to-do)
4. [Menjalankan proyek di laptop sendiri](#4-menjalankan-proyek-di-laptop-sendiri)
5. [Cara kerja dengan Git dan GitHub](#5-cara-kerja-dengan-git-dan-github)
6. [Memakai Claude Code (opsional)](#6-memakai-claude-code-opsional)
7. [Masalah yang sering muncul](#7-masalah-yang-sering-muncul)

---

## 1. Tentang proyek

**CekRef** adalah aplikasi web untuk memeriksa apakah referensi dalam daftar pustaka benar-benar ada. Mahasiswa menempelkan daftar pustaka (APA 7 atau IEEE), lalu CekRef:

1. memecah daftar menjadi entri-entri,
2. membaca penulis, tahun, judul, nama jurnal, dan DOI dari setiap entri,
3. mencari artikel yang cocok di **Crossref** (database metadata artikel ilmiah),
4. memberi label: **Cocok**, **Cocok Sebagian**, atau **Tidak Ditemukan di Database**, lengkap dengan alasannya.

**Latar belakang:** AI seperti ChatGPT sering "mengarang" sitasi yang terlihat meyakinkan tapi tidak ada. CekRef membantu mahasiswa memeriksanya, dan halaman Edukasi mengajarkan cara memeriksa secara manual.

**Konteks:** capstone mata kuliah Literasi Digital, Teknik Informatika, tim 2 orang, kurang dari 4 minggu. Penilaian menekankan **demo yang lancar** serta **dokumentasi & proses** (Git, testing, arsitektur).

### Prinsip yang tidak boleh dilanggar

- **Jangan pernah melabeli referensi sebagai "palsu".** Label terendah adalah "Tidak Ditemukan di Database", karena banyak jurnal Indonesia tidak terdaftar di Crossref. UI juga tidak memakai warna merah.
- **Tidak ada AI/LLM di jalur pengecekan.** Hasil harus bisa dijelaskan dan selalu sama untuk input yang sama.
- **Demo tidak boleh bergantung pada internet.** Hasil Crossref disimpan di cache, dan ada `DEMO_MODE` yang hanya membaca cache.
- **Algoritma inti ditulis sendiri**: parser, normalisasi, Jaro-Winkler, Jaccard, dan skor. Library hanya untuk hal umum seperti framework, database, UI, testing, dan hashing password.
- **Setiap fungsi inti wajib punya unit test.**
- Teks antarmuka berbahasa **Indonesia**; kode, nama variabel, dan komentar berbahasa **Inggris**.

### Alur engine

```
teks daftar pustaka
 → splitter    : pecah menjadi entri ([1] / 1. / baris kosong / deteksi awal entri)
 → parser      : deteksi APA/IEEE → { authors, year, title, venue, doi, url }
 → normalizer  : huruf kecil, hapus diakritik & tanda baca
 → lookup      : Crossref by DOI, atau pencarian bibliografis (pakai cache)
 → matcher     : bandingkan field input vs kandidat → skor berbobot
 → classifier  : skor + aturan → label + alasan berbahasa Indonesia
```

Bobot skor awal: judul 0.50, penulis 0.25, tahun 0.15, venue 0.10. Ambang awal: Cocok ≥ 0.85, Cocok Sebagian 0.60–0.85, dan di bawah itu Tidak Ditemukan. Angka ini disetel ulang saat evaluasi.

### Teknologi

| Bagian | Teknologi |
|---|---|
| Web & API | Next.js 16 (App Router) + TypeScript |
| Tampilan | Tailwind CSS 4 |
| Database | SQLite (file lokal) lewat Prisma 7.10.1 + adapter libSQL |
| Test | Vitest 5 |
| Login | email + password (bcrypt), cookie session httpOnly |

### Struktur folder

```
src/app/          halaman Next.js
src/engine/       splitter, parser, normalizer, similarity, matcher, classifier
src/lib/          crossref.ts (klien Crossref), db.ts (Prisma client)
src/config.ts     bobot, ambang, TITLE_METHOD
prisma/           schema.prisma dan migrasi database
tests/engine/     unit test engine
tests/fixtures/   15 referensi asli untuk test + tabel sumbernya
data/             testset.json untuk evaluasi
content/          materi edukasi dan soal pre/post-test
demo/             skenario demo
docs/             DECISIONS.md, panduan ini, arsitektur
```

---

## 2. Status saat ini

Per 12 November 2026: 12 commit di `main`, **196 test lulus**, lint dan typecheck bersih.

### Sudah selesai

| Fase | Isi | Dikerjakan oleh |
|---|---|---|
| 0 — Setup | Next.js, Tailwind, Prisma + SQLite, Vitest, struktur folder, README, `.env.example` | Anggota A |
| Fixture | 15 referensi asli (8 APA, 7 IEEE), 11 DOI diverifikasi ke Crossref, tabel sumber | Anggota A |
| 1 — Engine inti | `normalizer`, `similarity` (Jaro-Winkler, Jaccard), `splitter`, `parser` APA & IEEE | Anggota A |
| 1 — Perbaikan | judul APA bersingkatan, nama IEEE berpartikel, daftar tanpa pemisah | Anggota A |

Semua keputusan teknis dan keterbatasan yang diketahui tercatat di [DECISIONS.md](DECISIONS.md).

### Belum dikerjakan

| Fase | Isi |
|---|---|
| 2 | Klien Crossref, cache di database, `DEMO_MODE`, matcher, classifier, skrip `npm run check` |
| 3 | Halaman Cek dan Detail; hasil parsing bisa diedit lalu dicek ulang |
| 4 | Login, riwayat pengecekan, halaman Edukasi, pre/post-test, ringkasan skor, keamanan |
| 5 | Skrip `npm run eval` (precision, recall, F1, perbandingan Jaro-Winkler vs Jaccard) |
| 6 | Persiapan demo, `docs/ARCHITECTURE.md`, README final, review bug & keamanan |
| Manual | `data/testset.json` (60–100 entri), `content/` (materi + 10 soal), `demo/` (5 referensi buatan ChatGPT) |

---

## 3. Pembagian tugas dan to-do

**Anggota A** = pemilik repo, sudah mengerjakan Fase 0–1. **Anggota B** = bergabung mulai Fase 2.

Prinsip pembagian: kedua anggota **sama-sama menulis kode dan konten**, setiap orang punya bagian yang bisa dijelaskan sendiri ke dosen, dan pekerjaan bisa berjalan paralel.

### Urutan dan ketergantungan

```
Minggu ini      A: Fase 2 (Crossref, matcher, classifier)   B: setup laptop → Fase 4 (login, edukasi, tes)
                A & B: sepakati bentuk data hasil cek (CheckResult) di awal Fase 2
Setelah Fase 2  A: Fase 5 (evaluasi)                         B: Fase 3 (UI Cek & Detail)
Sepanjang waktu A & B: isi testset masing-masing separuh, saling review PR
Akhir           A & B: Fase 6 (demo, dokumentasi, latihan tanya-jawab)
```

Fase 4 tidak membutuhkan Crossref, jadi B bisa langsung mulai. Fase 3 (UI) menampilkan hasil matcher, jadi baru dikerjakan setelah Fase 2 selesai.

### To-do Anggota A

- [ ] Tambahkan B sebagai collaborator di GitHub (lihat [bagian 5](#5-cara-kerja-dengan-git-dan-github)).
- [ ] Buat GitHub Issues untuk setiap tugas di bawah dan assign ke orangnya.
- [ ] **Awal Fase 2:** usulkan bentuk `CheckResult` (label, skor, alasan, perbandingan per field, kandidat Crossref), lalu sepakati dengan B lewat PR kecil.
- [ ] **Fase 2:** `src/lib/crossref.ts`, model `Cache` di Prisma, `DEMO_MODE`, `matcher.ts`, `classifier.ts`, bobot & ambang di `config.ts`, skrip `npm run check -- file.txt`. Semua dengan test.
- [ ] **Fase 5:** skrip `npm run eval` dan laporan di `reports/`.
- [ ] Kumpulkan **separuh** `data/testset.json` (30–50 entri, separuh asli dan separuh bermasalah dari ChatGPT yang sudah dicek manual).
- [ ] Review setiap PR dari B.
- [ ] **Fase 6:** isi cache untuk skenario demo, `docs/ARCHITECTURE.md`, bagian engine dan evaluasi di laporan.

### To-do Anggota B

- [ ] Terima undangan collaborator, lalu setup laptop (lihat [bagian 4](#4-menjalankan-proyek-di-laptop-sendiri)).
- [ ] Baca CLAUDE.md, panduan ini, dan DECISIONS.md. Jalankan `npm test` dan pastikan semua lulus.
- [ ] **Fase 4:**
  - [ ] Model `User`, `CheckHistory`, `TestScore` di Prisma.
  - [ ] Register/login (bcrypt, cookie httpOnly + sameSite), logout.
  - [ ] Halaman Riwayat pengecekan.
  - [ ] Halaman Edukasi (kenapa AI bisa mengarang sitasi + 3 langkah verifikasi manual).
  - [ ] Pre-test dan post-test (10 soal), skor tersimpan, ringkasan rata-rata pre vs post.
  - [ ] Validasi input: maksimal 50 entri / 20.000 karakter.
- [ ] Tulis **sendiri** materi edukasi dan 10 soal tes di `content/`. Claude tidak boleh mengarang soalnya.
- [ ] **Fase 3 (setelah Fase 2 selesai):** halaman Cek (textarea → Periksa → tabel hasil berwarna hijau/kuning/abu-abu), halaman Detail (perbandingan field + tautan DOI), progres saat pengecekan, dan hasil parsing yang bisa diedit lalu dicek ulang.
- [ ] Kumpulkan **separuh** `data/testset.json` (30–50 entri).
- [ ] Review setiap PR dari A.
- [ ] **Fase 6:** bagian aplikasi, keamanan, dan edukasi di laporan; latihan demo.

### Bersama

- [ ] Sepakati format `data/testset.json`: `[{ "raw": "...", "label": "real" | "problematic", "source": "..." }]`.
- [ ] Siapkan 5 referensi buatan ChatGPT untuk demo di `demo/`.
- [ ] Latihan tanya-jawab: masing-masing harus bisa menjelaskan bagian yang dia kerjakan **dan** gambaran besar sistemnya.

### Kepemilikan file (mengurangi konflik)

| Pemilik | File/folder |
|---|---|
| A | `src/engine/`, `src/lib/crossref.ts`, `src/config.ts`, skrip eval, `tests/engine/` |
| B | `src/app/` (halaman), kode auth, `content/` |
| Bersama | `prisma/schema.prisma`, `package.json`, `data/testset.json`, dokumen |

Untuk file bersama: `git pull` dulu sebelum mengubah, ubah seperlunya, dan segera buat PR supaya yang lain tidak tertinggal. Perubahan `prisma/schema.prisma` sebaiknya dikabarkan di grup, karena kalian berdua akan menambah model.

---

## 4. Menjalankan proyek di laptop sendiri

Langkah ini untuk Windows. Jalankan perintah di **Command Prompt (cmd)** atau **Git Bash**.

### 4.1 Pasang alat yang dibutuhkan

| Alat | Versi | Unduh |
|---|---|---|
| Node.js | **24 LTS** (minimal 22.12) | https://nodejs.org |
| Git | terbaru | https://git-scm.com/download/win |
| VS Code (disarankan) | terbaru | https://code.visualstudio.com |

Setelah memasang, buka cmd baru lalu cek versinya:

```bash
node -v
```

```bash
git --version
```

`node -v` harus menampilkan `v24.x` (atau minimal `v22.12`).

### 4.2 Atur identitas Git (sekali saja)

Pakai nama dan **email yang sama dengan akun GitHub-mu**, supaya commit tercatat atas namamu di GitHub:

```bash
git config --global user.name "Nama Kamu"
```

```bash
git config --global user.email "email-akun-github@contoh.com"
```

### 4.3 Terima undangan dan clone repo

1. Buka email atau notifikasi GitHub, lalu terima undangan collaborator ke `saatriiaa404/CekRef`.
2. Pindah ke folder tempat proyek akan disimpan, lalu clone:

```bash
git clone https://github.com/saatriiaa404/CekRef.git
```

```bash
cd CekRef
```

Saat pertama kali push, Windows akan membuka jendela login GitHub. Login dengan akunmu sendiri.

### 4.4 Pasang dependensi

```bash
npm install
```

Perintah ini juga otomatis membuat Prisma Client di `src/generated/`. Peringatan `npm warn install-scripts ...` boleh diabaikan.

### 4.5 Buat file `.env`

File `.env` berisi pengaturan lokal dan **tidak ikut di-commit**. Salin dari contoh:

- cmd:
  ```bash
  copy .env.example .env
  ```
- Git Bash:
  ```bash
  cp .env.example .env
  ```

Buka `.env`, lalu isi `CROSSREF_MAILTO` dengan email aktifmu sendiri.

### 4.6 Cek semuanya berjalan

```bash
npm test
```

Semua test harus lulus (saat panduan ini ditulis: 196 test).

```bash
npm run dev
```

Buka http://localhost:3000. Halaman "CekRef — Aplikasi sedang dalam pengembangan" harus muncul. Tekan `Ctrl + C` di terminal untuk menghentikan server.

### 4.7 Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run test:watch` | Test berjalan ulang otomatis saat file berubah |
| `npm run lint` | Cek gaya kode |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run db:migrate` | Terapkan perubahan `schema.prisma` ke database lokal |
| `npm run db:generate` | Buat ulang Prisma Client |

---

## 5. Cara kerja dengan Git dan GitHub

Dosen akan melihat riwayat GitHub. Riwayat yang baik menunjukkan **dua akun yang sama-sama aktif**, pekerjaan yang dipecah per fitur, dan **review satu sama lain**.

### Aturan utama

1. **Jangan commit langsung ke `main`.** Setiap pekerjaan dibuat di branch sendiri.
2. **Satu fitur, satu branch, satu Pull Request (PR).**
3. **Setiap PR di-review anggota lain** sebelum di-merge. Beri komentar yang sungguhan: pertanyaan, saran, atau persetujuan beserta alasannya.
4. **Commit dari akun dan laptop masing-masing.** Jangan commit atas nama orang lain.
5. **Pesan commit memakai format konvensional:** `feat:` fitur baru, `fix:` perbaikan, `test:` test, `docs:` dokumen, `chore:` setup/perawatan.
6. **Jalankan `npm test` sebelum push.** PR yang test-nya gagal jangan di-merge.

### Pengaturan awal (Anggota A, sekali saja)

1. Buka https://github.com/saatriiaa404/CekRef → **Settings** → **Collaborators** → **Add people**, lalu masukkan username GitHub B.
2. (Disarankan) **Settings** → **Branches** → **Add branch ruleset** untuk `main`, lalu centang *Require a pull request before merging* dengan minimal 1 approval. Dengan ini tidak ada yang bisa push langsung ke `main`.

### Alur kerja satu fitur

**1. Ambil versi terbaru `main`**
```bash
git switch main
```
```bash
git pull
```

**2. Buat branch baru** (contoh nama: `feat/auth`, `feat/crossref`, `fix/parser-title`)
```bash
git switch -c feat/auth
```

**3. Kerjakan, lalu commit secara bertahap**
```bash
git add .
```
```bash
git commit -m "feat(auth): add register and login pages"
```

**4. Kirim branch ke GitHub**
```bash
git push -u origin feat/auth
```

**5. Buat Pull Request.** Buka repo di GitHub, klik **Compare & pull request**, tulis ringkasan perubahan dan cara mengujinya, lalu pilih anggota lain sebagai **Reviewer**.

**6. Review.** Reviewer membuka tab **Files changed**, memberi komentar, lalu memilih **Approve** atau **Request changes**.

**7. Merge.** Setelah di-approve, klik **Merge pull request**, lalu hapus branch-nya.

**8. Kembali ke `main` dan ambil hasil merge**
```bash
git switch main
```
```bash
git pull
```

### Bila terjadi konflik

Konflik terjadi bila kalian mengubah baris yang sama. Cara mengatasinya:

```bash
git switch feat/nama-branch
```
```bash
git merge main
```

Buka file yang ditandai konflik di VS Code, pilih bagian yang benar, simpan, lalu:

```bash
git add .
```
```bash
git commit -m "chore: resolve merge conflict with main"
```

Bila ragu, jangan memaksa: tanyakan dulu ke anggota lain.

---

## 6. Memakai Claude Code (opsional)

Proyek ini disiapkan untuk dikerjakan bersama Claude Code. CLAUDE.md dibaca otomatis di setiap sesi.

- Kerjakan **satu fase per sesi**, memakai prompt yang ada di [PROMPTS.md](../PROMPTS.md).
- Minta Claude **menunjukkan rencana dulu** sebelum menulis kode.
- **Pahami kode yang dihasilkan.** Dosen akan bertanya, dan setiap anggota harus bisa menjelaskan bagiannya sendiri. Prompt "Jelaskan cara kerja … baris per baris" di PROMPTS.md membantu untuk ini.
- Konten tes, materi edukasi, dan isi `data/testset.json` **ditulis sendiri**, bukan oleh AI.

---

## 7. Masalah yang sering muncul

| Gejala | Penyebab & solusi |
|---|---|
| `'node' is not recognized` | Node.js belum terpasang atau terminal belum dibuka ulang. Pasang Node, tutup terminal, lalu buka lagi. |
| `npm.ps1 cannot be loaded because running scripts is disabled` | Muncul di PowerShell. Pakai **Command Prompt (cmd)** atau **Git Bash** saja. |
| `Cannot find module '@/generated/prisma/client'` | Prisma Client belum dibuat. Jalankan `npm run db:generate`. |
| `npm install` gagal dengan `ERESOLVE` | Versi Node terlalu lama. Pastikan `node -v` menampilkan v24 (atau minimal v22.12). |
| Port 3000 sudah dipakai | Next.js otomatis memakai port lain (mis. 3001). Lihat alamatnya di terminal. |
| `git push` ditolak (`rejected ... fetch first`) | Ada perubahan baru di GitHub. Jalankan `git pull`, selesaikan konflik bila ada, lalu push lagi. |
| `Permission denied` saat push | Undangan collaborator belum diterima, atau login GitHub memakai akun lain. |
| File `.env` tidak ada setelah clone | Memang tidak ikut di-commit. Buat dari `.env.example` (lihat 4.5). |
