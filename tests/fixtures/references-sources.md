# Sumber Fixture Referensi

Tabel verifikasi untuk [references.txt](references.txt). Nomor baris di tabel ini **sama dengan urutan entri** di `references.txt`.

- Daftar awal dikumpulkan dengan bantuan Perplexity, lalu setiap entri dicek manual lewat tautan sumbernya.
- Ke-11 DOI dicek ke Crossref API (`/works/{doi}`) pada 2026-11-12. Semuanya ditemukan, dan judul, tahun, volume, serta halamannya cocok.
- Kolom "Kasus" dihitung ulang dari teks sitasi di `references.txt`, karena label dari Perplexity beberapa kali keliru (lihat catatan di bawah).

## Kode kasus

| Kode | Kasus |
|---|---|
| 1 | Lebih dari 3 penulis |
| 2 | Memakai "et al." |
| 3 | Judul mengandung titik dua |
| 4a | DOI berbentuk URL (`https://doi.org/...`) |
| 4b | DOI berbentuk `doi: 10.xxxx/...` |
| 5 | Tanpa DOI |
| 6 | Tanpa tahun (`n.d.`) |
| 7 | Penulis Indonesia bernama satu kata |
| 8 | Nama penulis dengan diakritik |

## Tabel

| No | Gaya | Kasus | Penulis | Tahun | Judul | Jurnal/Konferensi | DOI | Tautan sumber | Crossref |
|---|---|---|---|---|---|---|---|---|---|
| 1 | APA | 3, 4a, 7 | Refina Dilasani; Sudiran; Hartono | 2025 | Students’ perceptions of English teachers’ emotional intelligence in shaping their speaking skills: A qualitative study | Journal of English and Education (JEE), 11(2), 88–102 | 10.20885/jee.v11i2.43416 | https://journal.uii.ac.id/JEE/article/view/43416 | Cocok |
| 2 | APA | 3, 4a | Muhammad Ari Saputra; Rizky Yolanda; Zelly Putriani | 2025 | Cross-curricular perspectives on English language education: A qualitative comparative study between Indonesia and Australia | Journal of English and Education (JEE), 11(2), 103–117 | 10.20885/jee.v11i2.40416 | https://journal.uii.ac.id/JEE/article/view/40416 | Cocok |
| 3 | APA | 4a | Hikmah Pravitasari; Elih Sutisna Yanto; I. N. K. Fatihah | 2025 | Emotional experiences and identity construction of pre-service English teachers during teaching practicum in Indonesia | Journal of English and Education (JEE), 11(1), 68–87 | 10.20885/jee.v11i1.40130 | https://journal.uii.ac.id/JEE/article/view/40130 | Cocok |
| 4 | APA | 4a, 7 | Shayda Agustina; Hasby; Cyndi Prasetya | 2026 | Augmented Reality-Based LKPD Innovation Using Assemblr Edu for Atomic Structure Content | IJCER (International Journal of Chemistry Education Research), 10(1), 56–66 | 10.20885/ijcer.vol10.iss1.art6 | https://journal.uii.ac.id/IJCER/article/view/48037 | Cocok |
| 5 | IEEE | 5 | N. L. Sudarno; S. Anggoro; M. Fukui | 2025 | Development of Augmented Reality Learning Media Based on Inquiry Based Learning Using Assemblr Edu on Light and Properties Material | JES, 9(5), 3322–3335 | tidak ada | https://jes.ejournal.unri.ac.id/index.php/JES/article/view/898 | – |
| 6 | IEEE | 1, 2, 3, 4b | S. Yamtinah; E. S. VH; S. Saputro; S. R. D. Ariani; A. S. Shidiq; D. R. Sari; D. G. Ilyasa | 2023 | Augmented reality learning media based on tetrahedral chemical representation: How effective in learning process? | EURASIA Journal of Mathematics, Science and Technology Education, 19(8), em2313 | 10.29333/ejmste/13436 | https://doi.org/10.29333/ejmste/13436 | Cocok |
| 7 | IEEE | 1, 3, 4b | P. N. Son; T. T. A. Dang; V. T. T. Hoai; H. M. Thai; V. T. Chu; M. H. Nguyen | 2025 | Augmented reality to enhance chemistry learning outcomes in Vietnamese lower secondary schools: A quasi-experimental study on acid-base–pH–oxide–salt topics | European Journal of Educational Research, 14(4), 1259–1275 | 10.12973/eu-jer.14.4.1259 | https://doi.org/10.12973/eu-jer.14.4.1259 | Cocok |
| 8 | APA | 1, 3, 4a | J. Radianti; T. A. Majchrzak; J. Fromm; I. Wohlgenannt | 2020 | A systematic review of immersive virtual reality applications for higher education: Design elements, lessons learned, and research agenda | Computers & Education, 147, Article 103778 | 10.1016/j.compedu.2019.103778 | https://www.sciencedirect.com/science/article/pii/S0360131519303283 | Cocok |
| 9 | APA | 3, 4a, 8 | N. M. Đức; N. V. Quang | 2024 | Application of Augmented Reality in Chemistry Education: A Systemic Review Based on Bibliometric Analysis from 2002 to 2023 | International Journal of Education in Mathematics, Science and Technology, 12(6), 1415–1434 | 10.46328/ijemst.4265 | https://doi.org/10.46328/ijemst.4265 | Cocok |
| 10 | IEEE | 1, 4b | D. A. Karnishyna; T. V. Selivanova; P. P. Nechypurenko; T. V. Starova; S. O. Semerikov | 2024 | Enhancing high school students’ understanding of molecular geometry with augmented reality | Science Education Quarterly, 1(2), 25–40 | 10.55056/seq.818 | https://doi.org/10.55056/seq.818 | Cocok |
| 11 | IEEE | 1, 2, 5 | T. B. Brown; B. Mann; N. Ryder; M. Subbiah; J. Kaplan; P. Dhariwal; A. Neelakantan; et al. | 2020 | Language models are few-shot learners | Advances in Neural Information Processing Systems 33, 1877–1901 | tidak ada | https://papers.nips.cc/paper_files/paper/2020/hash/1457c0d6bfcb4967418bfb8ac142f64a-Abstract.html | – |
| 12 | APA | 5, 6 | World Health Organization | tidak ada (n.d.) | Coronavirus disease (COVID-19) pandemic | World Health Organization | tidak ada | https://www.who.int/emergencies/diseases/novel-coronavirus-2019 | – |
| 13 | APA | 1, 3, 4a | Vireak Keo; Rathana Sam; Bora Lan; William Rouet | 2025 | Students’ perceptions and effects of technology integration in English learning: A case study at National University of Battambang | Journal of English and Education (JEE), 11(1), 1–26 | 10.20885/jee.v11i1.37268 | https://journal.uii.ac.id/JEE/article/view/37268 | Cocok |
| 14 | IEEE | 1, 5, 8 | A. Vaswani; N. Shazeer; N. Parmar; J. Uszkoreit; L. Jones; A. N. Gomez; Ł. Kaiser; I. Polosukhin | 2017 | Attention is all you need | arXiv preprint arXiv:1706.03762 | tidak ada | https://arxiv.org/abs/1706.03762 | – |
| 15 | IEEE | 4b | J. Schmidhuber | 2015 | Deep learning in neural networks: An overview | Neural Networks, 61, 85–117 | 10.1016/j.neunet.2014.09.003 | https://www.sciencedirect.com/science/article/pii/S0893608014002135 | Cocok |

## Catatan koreksi terhadap tabel asli dari Perplexity

- **Encoding rusak.** CSV dibuka dengan encoding yang salah, sehingga `–`, `’`, `Ł`, dan `Đức` tampil sebagai `â€“`, `â€™`, `Å`, dan `Äá»©c`. Semua sudah dikembalikan ke karakter aslinya.
- **Teks sisa di judul.** Akhiran " journal.uii.ac" menempel di judul 11 entri, termasuk entri yang bukan dari jurnal UII. Teks ini sisa tautan sitasi dan sudah dihapus.
- **Label kasus keliru:**
  - Kasus 1 (lebih dari 3 penulis) ditandai pada entri yang hanya punya 3 penulis (Dilasani, Saputra, Pravitasari, Agustina).
  - Kasus 2 (et al.) ditandai pada Vaswani, padahal di sitasinya semua 8 penulis ditulis lengkap.
  - Kasus 8 (diakritik) ditandai pada Schmidhuber, padahal diakritik `Ł` ada di Vaswani.
- **Data Crossref yang berbeda dari sitasi** (penting untuk matcher di Fase 2):
  - "Đức" tersimpan sebagai "Duc".
  - "Son" tersimpan sebagai "Ngoc Son".
  - Penulis kedua Yamtinah tersimpan sebagai "Susanti VH".
  - Penulis kedua dan ketiga Saputra tersimpan dengan nama lengkap di kolom nama belakang ("Rizky Yolanda", "Zelly Putriani").
  - Nama jurnal Radianti berisi entitas HTML `Computers &amp; Education`.
  - Judul Saputra punya spasi ganda dan huruf kapital berbeda ("A Qualitative").
  - IJCER dan IJEMST tidak menyertakan volume/nomor.
