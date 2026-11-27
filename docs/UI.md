# Rancangan UI CekRef

Untuk Anggota B (Fase 3 dan Fase 4). Dokumen ini menjelaskan **halaman apa saja yang dibuat, isinya, keadaan khusus yang harus ditangani, dan dari mana datanya diambil**.

- Lingkup fitur mengikuti [CLAUDE.md](../CLAUDE.md) Bagian 5. Jangan menambah halaman atau fitur di luar dokumen ini tanpa diskusi.
- Tugas, aturan, dan kriteria selesai ada di [FASE-3-4.md](FASE-3-4.md).
- Hal yang belum diputuskan ditandai **(sepakati)**. Hasil kesepakatannya dicatat di [DECISIONS.md](DECISIONS.md).
- Gambar kerangka di bawah hanya **gambaran susunan**, bukan desain final. Rizqi bebas menentukan detail visualnya selama prinsip di bagian 1 dipenuhi.

---

## 1. Prinsip tampilan

| Aturan | Alasannya |
|---|---|
| Semua teks antarmuka berbahasa Indonesia | Aturan CLAUDE.md Bagian 2 |
| Label: 🟢 **Cocok**, 🟡 **Cocok Sebagian**, ⚪ **Tidak Ditemukan di Database** | Merah tidak dipakai sama sekali, karena "tidak ditemukan" bukan berarti palsu |
| Teks label **selalu ditulis**, tidak hanya warna | Tetap terbaca oleh pengguna buta warna |
| Pesan error memakai warna kuning/abu, bukan merah | Konsisten dengan prinsip "tidak menuduh" |
| Tidak pernah menulis kata "palsu" | Aturan CLAUDE.md Bagian 2 butir 1 |
| Bisa dipakai di layar HP | Tabel berubah menjadi kartu di layar sempit |
| Sederhana dan bersih | Ini aplikasi edukasi, bukan dashboard rumit |

---

## 2. Peta halaman

| Alamat | Halaman | Perlu login? | Fase |
|---|---|---|---|
| `/` | **Cek** (halaman utama) | Ya **(sepakati)** | 3 |
| `/daftar`, `/masuk` | Daftar dan Masuk | Tidak | 4 |
| `/edukasi` | Edukasi | Tidak | 4 |
| `/tes/pre`, `/tes/post` | Pre-test dan Post-test | Ya | 4 |
| `/riwayat`, `/riwayat/[id]` | Daftar riwayat dan hasil lama | Ya | 4 (halaman), 3 (isi) |
| `/admin` | Ringkasan skor | Ya, khusus admin | 4 |

**Saran alur pengguna:**

```
Daftar → Pre-test → Cek → Edukasi → Post-test
```

Halaman Cek mewajibkan login supaya pre-test selalu dikerjakan lebih dulu, dan riwayat otomatis tersimpan **(sepakati)**.

---

## 3. Kerangka umum (semua halaman)

```
┌────────────────────────────────────────────────────────────┐
│ CekRef      Cek   Edukasi   Tes   Riwayat        [Keluar]  │  ← menu atas
├────────────────────────────────────────────────────────────┤
│ ⓘ Mode demo: data dibaca dari cache, tanpa internet.       │  ← hanya bila DEMO_MODE=true
├────────────────────────────────────────────────────────────┤
│                       (isi halaman)                        │
└────────────────────────────────────────────────────────────┘
```

- Sebelum login, menu kanan atas menampilkan **[Masuk] [Daftar]**.
- Menu **Admin** hanya muncul untuk akun admin.

---

## 4. Halaman Cek (Fase 3, inti demo)

### 4.1 Keadaan awal

```
Periksa Daftar Pustaka
Tempel daftar pustaka (APA 7 atau IEEE). Pisahkan tiap referensi
dengan baris baru, baris kosong, atau nomor [1] / 1.

┌──────────────────────────────────────────────────────────┐
│ [1] J. Schmidhuber, "Deep learning in neural networks... │
│ [2] ...                                                  │
└──────────────────────────────────────────────────────────┘
2.430 / 20.000 karakter                           [ Periksa ]
```

- Tombol **Periksa** tidak aktif bila isian kosong.
- Bila lebih dari 20.000 karakter atau 50 referensi, muncul pesan kuning: *"Maksimal 50 referensi / 20.000 karakter per pemeriksaan."*

### 4.2 Saat memeriksa

```
Memeriksa 3 dari 12 referensi...
[██████░░░░░░░░░░░░░░] 25%
```

Angkanya berasal dari callback `onProgress(selesai, total)` milik `checkReferences`.

### 4.3 Hasil

```
Hasil: 🟢 8 Cocok   🟡 3 Cocok Sebagian   ⚪ 1 Tidak Ditemukan

┌────┬──────────────────────────────┬──────────────────┬──────┬───────────────────────────┬────────┐
│ No │ Referensi                    │ Status           │ Skor │ Alasan utama              │        │
├────┼──────────────────────────────┼──────────────────┼──────┼───────────────────────────┼────────┤
│ 1  │ Deep learning in neural...   │ 🟢 Cocok         │ 100% │ Semua data utama cocok    │ Detail │
│    │ Schmidhuber · 2015           │                  │      │                           │        │
│ 2  │ Attention is all you need    │ 🟡 Cocok Sebagian│  83% │ Tahun berbeda (input 2017,│ Detail │
│    │ Vaswani dkk. · 2017          │                  │      │ database 2025) +1 lainnya │        │
│ 3  │ Language models are few-shot │ ⚪ Tidak Ditemukan│  43% │ Kandidat terdekat kurang  │ Detail │
│    │ Brown dkk. · 2020            │ di Database      │      │ mirip. Periksa manual.    │        │
└────┴──────────────────────────────┴──────────────────┴──────┴───────────────────────────┴────────┘

ⓘ "Tidak Ditemukan di Database" bukan berarti referensi palsu. Banyak jurnal
  (terutama jurnal Indonesia) tidak terdaftar di Crossref. Pelajari cara cek
  manual di halaman Edukasi.
```

- Kolom **Referensi** menampilkan judul hasil parsing (atau teks asli bila judul tidak terbaca), lalu baris kecil berisi nama penulis pertama ("dkk." bila lebih dari satu) dan tahun.
- Di HP, setiap baris menjadi **kartu**: status, judul, skor, alasan utama, dan tombol Detail.
- Kotak keterangan di bawah tabel **wajib ada**. Inilah sisi edukasinya.

---

## 5. Detail entri (Fase 3)

**Saran bentuk:** panel yang terbuka di bawah baris tabel saat **Detail** diklik, bukan halaman terpisah. Hasil cek ada di layar saat itu, jadi tidak perlu disimpan dulu **(sepakati)**.

```
🟡 Cocok Sebagian · Skor 83% · dicocokkan lewat pencarian · dari cache

┌───────────┬──────────────────────────┬──────────────────────────┬────────────────────┐
│ Data      │ Yang kamu tulis          │ Di database (Crossref)   │ Kemiripan          │
├───────────┼──────────────────────────┼──────────────────────────┼────────────────────┤
│ Judul     │ Attention is all you need│ Attention Is All You Need│ 100%               │
│ Penulis   │ Vaswani; Shazeer; ...    │ Vaswani; Shazeer; ...    │ 100%               │
│ Tahun     │ 2017                     │ 2025                     │ 0%   ⚠️            │  ← < 85% disorot kuning
│ Jurnal    │ arXiv preprint ...       │ —                        │ tidak dibandingkan │
└───────────┴──────────────────────────┴──────────────────────────┴────────────────────┘

Alasan:
• Tahun berbeda (input 2017, database 2025).

🔗 Buka artikel di database: https://doi.org/10.65215/pc26a033
```

- Baris dengan kemiripan di bawah 85% disorot kuning.
- Bila `similarity` bernilai `null`, tampilkan *"tidak dibandingkan"*. Artinya data itu kosong di salah satu sisi.
- Bila tidak ada kandidat sama sekali (`best` = `null`), tabel diganti dengan pesan *"Tidak ada kandidat di Crossref."* beserta tautan ke halaman Edukasi.

### 5.1 Koreksi hasil pembacaan lalu cek ulang

Bagian yang bisa dibuka-tutup di dalam panel Detail:

```
▸ Koreksi hasil pembacaan
  Sistem salah membaca referensimu? Perbaiki lalu cek ulang.

  Penulis (satu per baris): [Vaswani                     ]
                            [Shazeer                     ]
  Tahun:                    [2017]
  Judul:                    [Attention is all you need   ]
  Jurnal/Konferensi:        [arXiv preprint arXiv:1706...]
  DOI:                      [                            ]
                                                [ Cek ulang ]

  Teks asli: A. Vaswani, N. Shazeer, ... (hanya dibaca)
```

- Form diisi dari `parsed`. Setelah diedit, kirim objek `parsed` yang sudah diubah ke `checkParsed`.
- Hasil cek ulang **menggantikan** baris tersebut di tabel.

---

## 6. Daftar dan Masuk (Fase 4)

```
Daftar Akun                          Masuk
Email:      [               ]        Email:    [               ]
Password:   [               ]        Password: [               ]
Ulangi:     [               ]                          [ Masuk ]
(minimal 8 karakter)                 Belum punya akun? Daftar
                      [ Daftar ]
```

- Pesan error login selalu: *"Email atau password salah."* Pesannya tidak membedakan email yang tidak terdaftar dengan password yang salah.
- Setelah daftar, arahkan ke pre-test.

---

## 7. Edukasi (Fase 4)

- Satu halaman bacaan. Isinya diambil dari `content/` dan **ditulis sendiri**.
- **Bagian 1:** kenapa AI bisa mengarang sitasi.
- **Bagian 2:** tiga langkah verifikasi manual, dalam bentuk kartu bernomor 1–2–3.
- Di bagian bawah ada tombol **[ Coba cek daftar pustakamu ]** ke halaman Cek, dan **[ Kerjakan post-test ]**.

---

## 8. Pre-test dan Post-test (Fase 4)

```
Pre-test (1 dari 10)                                    ●○○○○○○○○○
Referensi berikut asli atau bermasalah?

  Radianti, J., Majchrzak, T. A., ... (2020). A systematic review...

  ( ) Asli      ( ) Bermasalah
                                       [ Sebelumnya ] [ Berikutnya ]
```

- Pilihan lain: semua 10 soal dalam satu halaman bergulir, lalu tombol **Kumpulkan** **(sepakati)**.
- Setelah dikumpulkan, tampilkan *"Skor kamu: 6 / 10"*.
  - **Pre-test:** tampilkan skornya saja, **tanpa** kunci jawaban, supaya post-test tetap adil **(sepakati)**.
  - **Post-test:** tampilkan skor, perbandingan dengan pre-test, dan pembahasan setiap soal **(sepakati)**.

---

## 9. Riwayat (Fase 4 halaman, Fase 3 isi)

```
Riwayat Pengecekan
┌──────────────────┬────────┬──────────────────────────────┬───────┐
│ Tanggal          │ Jumlah │ Hasil                        │       │
├──────────────────┼────────┼──────────────────────────────┼───────┤
│ 22 Nov 2026 14.05│ 12     │ 🟢 8  🟡 3  ⚪ 1             │ Lihat │
└──────────────────┴────────┴──────────────────────────────┴───────┘
```

- Kalau masih kosong: *"Belum ada pengecekan. Mulai di halaman Cek."*
- **Lihat** membuka tabel hasil yang sama dengan halaman Cek, dalam mode baca saja.

---

## 10. Admin (Fase 4)

```
Ringkasan Pre-test vs Post-test
Peserta: 24      Rata-rata pre-test: 5,4 / 10      Rata-rata post-test: 7,8 / 10
Peningkatan: +2,4
```

Cukup angka. Grafik tidak wajib. Angka di atas hanya contoh tampilan.

---

## 11. Keadaan khusus yang harus punya tampilan

| Keadaan | Tampilan |
|---|---|
| Sedang memeriksa | Progres "Memeriksa X dari Y referensi..." |
| Crossref tidak bisa dihubungi | Muncul sebagai alasan di baris terkait. Halaman tidak crash |
| Mode demo aktif | Banner abu-abu di atas halaman |
| Input kosong | Tombol Periksa tidak aktif |
| Input terlalu panjang | Pesan kuning di bawah textarea |
| Belum login | Diarahkan ke halaman Masuk |
| Riwayat kosong | Pesan ajakan ke halaman Cek |

---

## 12. Hubungan UI dengan data dari engine

Fungsi yang dipakai (dari `src/engine/check.ts`):

- `checkReferences(text, { crossref, onProgress })` untuk tombol **Periksa**, menghasilkan `CheckResult[]`.
- `checkParsed(parsed, { crossref })` untuk tombol **Cek ulang**, menghasilkan satu `CheckResult`.
- Klien Crossref dibuat dengan `createCrossrefFromEnv()` (`src/lib/crossref-env.ts`), yang otomatis membaca `DEMO_MODE` dan `CROSSREF_MAILTO`.

Kedua fungsi itu berjalan di **server**, karena memakai database dan Crossref. Panggil dari route handler atau server action Next.js, bukan dari komponen di browser.

| Di layar | Diambil dari `CheckResult` |
|---|---|
| Status (teks + warna) | `label` → `LABEL_TEXT[label]` (`src/engine/classifier.ts`) |
| Skor % | `Math.round(score * 100)` |
| Alasan utama dan "+N lainnya" | `reasons[0]` dan `reasons.length - 1` |
| Tabel perbandingan Detail | `fields[]` → `field`, `input`, `database`, `similarity` |
| Link DOI | `best.doi` → `https://doi.org/<doi>` |
| "lewat DOI / pencarian · dari cache" | `lookup` (`doi` / `search` / `none`) dan `fromCache` |
| Form koreksi | `parsed` (`authors`, `year`, `title`, `venue`, `doi`, `raw`) |

Nama field yang ditampilkan:

| `field` | Teks di layar |
|---|---|
| `title` | Judul |
| `authors` | Penulis |
| `year` | Tahun |
| `venue` | Jurnal |

---

## 13. Yang perlu disepakati

1. Apakah halaman Cek wajib login?
2. Apakah Detail berupa panel di bawah baris atau halaman terpisah?
3. Apakah tes ditampilkan satu soal per layar atau semua soal dalam satu halaman?
4. Apakah pembahasan soal hanya ditampilkan setelah post-test?

Hasil kesepakatan dicatat di `docs/DECISIONS.md`, lalu tanda **(sepakati)** di dokumen ini diperbarui.