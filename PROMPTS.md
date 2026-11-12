# Prompt per Fase untuk Claude Code

Cara pakai: taruh `CLAUDE.md` dan file ini di folder proyek kosong, buka Claude Code di folder itu, lalu kirim prompt fase demi fase. Jangan lanjut ke fase berikutnya sebelum test lulus dan kamu paham apa yang dibuat.

---

## Fase 0 — Setup (hari 1)

```
Baca CLAUDE.md. Siapkan proyek sesuai Bagian 3: Next.js + TypeScript + Tailwind + Prisma (SQLite) + Vitest, git init, .gitignore, .env.example, README berisi cara menjalankan. Buat struktur folder sesuai Bagian 4 dengan file kosong. Belum perlu fitur apa pun. Tunjukkan rencanamu dulu sebelum mengeksekusi.
```

## Fase 1 — Engine inti tanpa jaringan (hari 2–5)

```
Implementasikan splitter, parser (APA 7 dan IEEE), normalizer, dan similarity (jaroWinkler, jaccardTokens) sesuai CLAUDE.md Bagian 4. Tulis sendiri, tanpa library similarity. Buat unit test untuk masing-masing, termasuk kasus sulit: penulis > 3 orang, "et al.", judul dengan titik dua, DOI berbentuk URL, entri tanpa tahun, nama penulis Indonesia satu kata. Pakai contoh referensi di tests/fixtures/ yang akan aku sediakan. Jalankan npm test dan laporkan.
```
> Sebelum fase ini: siapkan 10–15 contoh referensi asli (APA & IEEE) di `tests/fixtures/references.txt`.

## Fase 2 — Crossref, cache, matcher, classifier (hari 6–9)

```
Implementasikan src/lib/crossref.ts (DOI lookup + query.bibliographic, mailto dari env, konkurensi ≤3, timeout, retry, cache di SQLite via Prisma) lalu matcher dan classifier sesuai CLAUDE.md Bagian 4, dengan ambang dan bobot di file config. Tambahkan DEMO_MODE yang hanya membaca cache. Test: mock respons Crossref untuk unit test; satu integration test end-to-end memakai fixture. Buat skrip CLI `npm run check -- file.txt` untuk menguji pipeline dari terminal sebelum ada UI.
```

## Fase 3 — UI utama (hari 10–13)

```
Buat halaman Cek dan halaman Detail sesuai CLAUDE.md Bagian 5 butir 1–3. UI bahasa Indonesia, sederhana dan jelas, label berwarna (hijau/kuning/abu-abu — jangan merah, karena "tidak ditemukan" bukan berarti palsu). Tampilkan progres saat pengecekan berjalan. Hasil parsing bisa diedit lalu dicek ulang.
```

## Fase 4 — Akun, riwayat, edukasi, pre/post-test (hari 14–17)

```
Implementasikan CLAUDE.md Bagian 5 butir 4–6 dan Bagian 7 (keamanan). Konten edukasi dan soal tes aku sediakan di content/; jangan mengarang soalnya. Simpan skor pre-test dan post-test per pengguna, dan buat halaman ringkasan admin sederhana yang menampilkan rata-rata skor pre vs post.
```
> Sebelum fase ini: tulis sendiri materi edukasi dan 10 soal tes di `content/`.

## Fase 5 — Evaluasi (hari 18–21)

```
Implementasikan `npm run eval` sesuai CLAUDE.md Bagian 6 memakai data/testset.json. Bandingkan TITLE_METHOD jw vs jaccard, lalu coba beberapa ambang (0.55–0.90) dan laporkan kombinasi dengan F1 terbaik dalam tabel. Jangan ubah config otomatis; tampilkan rekomendasi dan alasannya, aku yang memutuskan.
```
> Sebelum fase ini: isi `data/testset.json` (target 60–100 entri, separuh asli, separuh bermasalah yang sudah dicek manual).

## Fase 6 — Persiapan demo (hari 22–25)

```
Siapkan demo: isi cache untuk skenario demo (5 referensi buatan ChatGPT yang sudah aku siapkan di demo/), pastikan DEMO_MODE berjalan tanpa internet, rapikan README (cara install, arsitektur, cara evaluasi), buat docs/ARCHITECTURE.md dengan diagram alur dari CLAUDE.md Bagian 4. Lalu lakukan review: cari bug, kasus input yang membuat crash, dan celah keamanan, dan laporkan sebelum memperbaiki.
```

---

## Prompt cadangan yang sering berguna

- **Saat ada error:** `Ini error-nya: <tempel>. Cari akar masalahnya dulu, jelaskan, baru perbaiki. Jangan ubah hal lain.`
- **Supaya paham kode sendiri (penting untuk sesi tanya-jawab dosen):** `Jelaskan cara kerja src/engine/matcher.ts baris per baris seolah aku harus mempresentasikannya ke dosen. Lalu beri 5 pertanyaan yang mungkin ditanyakan dosen beserta jawabannya.`
- **Saat Claude Code mulai melebar:** `Berhenti. Kembali ke lingkup di CLAUDE.md Bagian 5. Apa yang kamu ubah di luar lingkup? Kembalikan.`
