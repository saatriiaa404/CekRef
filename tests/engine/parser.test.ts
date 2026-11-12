import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseReference } from "@/engine/parser";
import { splitEntries } from "@/engine/splitter";
import type { CitationStyle } from "@/engine/types";

// Ground truth copied by hand from tests/fixtures/references-sources.md (same order as references.txt).
interface Expected {
  style: CitationStyle;
  families: string[];
  etAl: boolean;
  year: number | null;
  title: string;
  venue: string | null;
  doi: string | null;
  url: string | null;
}

const EXPECTED: Expected[] = [
  {
    style: "apa",
    families: ["Dilasani", "Sudiran", "Hartono"],
    etAl: false,
    year: 2025,
    title:
      "Students’ perceptions of English teachers’ emotional intelligence in shaping their speaking skills: A qualitative study",
    venue: "Journal of English and Education (JEE)",
    doi: "10.20885/jee.v11i2.43416",
    url: null,
  },
  {
    style: "apa",
    families: ["Saputra", "Yolanda", "Putriani"],
    etAl: false,
    year: 2025,
    title:
      "Cross-curricular perspectives on English language education: A qualitative comparative study between Indonesia and Australia",
    venue: "Journal of English and Education (JEE)",
    doi: "10.20885/jee.v11i2.40416",
    url: null,
  },
  {
    style: "apa",
    families: ["Pravitasari", "Yanto", "Fatihah"],
    etAl: false,
    year: 2025,
    title: "Emotional experiences and identity construction of pre-service English teachers during teaching practicum in Indonesia",
    venue: "Journal of English and Education (JEE)",
    doi: "10.20885/jee.v11i1.40130",
    url: null,
  },
  {
    style: "apa",
    families: ["Agustina", "Hasby", "Prasetya"],
    etAl: false,
    year: 2026,
    title: "Augmented Reality-Based LKPD Innovation Using Assemblr Edu for Atomic Structure Content",
    venue: "IJCER (International Journal of Chemistry Education Research)",
    doi: "10.20885/ijcer.vol10.iss1.art6",
    url: null,
  },
  {
    style: "ieee",
    families: ["Sudarno", "Anggoro", "Fukui"],
    etAl: false,
    year: 2025,
    title:
      "Development of Augmented Reality Learning Media Based on Inquiry Based Learning Using Assemblr Edu on Light and Properties Material",
    venue: "JES",
    doi: null,
    url: "https://jes.ejournal.unri.ac.id/index.php/JES/article/view/898",
  },
  {
    style: "ieee",
    families: ["Yamtinah"],
    etAl: true,
    year: 2023,
    title: "Augmented reality learning media based on tetrahedral chemical representation: How effective in learning process?",
    venue: "EURASIA Journal of Mathematics, Science and Technology Education",
    doi: "10.29333/ejmste/13436",
    url: null,
  },
  {
    style: "ieee",
    families: ["Son", "Dang", "Hoai", "Thai", "Chu", "Nguyen"],
    etAl: false,
    year: 2025,
    title:
      "Augmented reality to enhance chemistry learning outcomes in Vietnamese lower secondary schools: A quasi-experimental study on acid-base–pH–oxide–salt topics",
    venue: "European Journal of Educational Research",
    doi: "10.12973/eu-jer.14.4.1259",
    url: null,
  },
  {
    style: "apa",
    families: ["Radianti", "Majchrzak", "Fromm", "Wohlgenannt"],
    etAl: false,
    year: 2020,
    title:
      "A systematic review of immersive virtual reality applications for higher education: Design elements, lessons learned, and research agenda",
    venue: "Computers & Education",
    doi: "10.1016/j.compedu.2019.103778",
    url: null,
  },
  {
    style: "apa",
    families: ["Đức", "Quang"],
    etAl: false,
    year: 2024,
    title:
      "Application of Augmented Reality in Chemistry Education: A Systemic Review Based on Bibliometric Analysis from 2002 to 2023",
    venue: "International Journal of Education in Mathematics, Science and Technology",
    doi: "10.46328/ijemst.4265",
    url: null,
  },
  {
    style: "ieee",
    families: ["Karnishyna", "Selivanova", "Nechypurenko", "Starova", "Semerikov"],
    etAl: false,
    year: 2024,
    title: "Enhancing high school students’ understanding of molecular geometry with augmented reality",
    venue: "Science Education Quarterly",
    doi: "10.55056/seq.818",
    url: null,
  },
  {
    style: "ieee",
    families: ["Brown"],
    etAl: true,
    year: 2020,
    title: "Language models are few-shot learners",
    venue: "Advances in Neural Information Processing Systems 33",
    doi: null,
    url: "https://papers.nips.cc/paper_files/paper/2020/hash/1457c0d6bfcb4967418bfb8ac142f64a-Abstract.html",
  },
  {
    style: "apa",
    families: ["World Health Organization"],
    etAl: false,
    year: null,
    title: "Coronavirus disease (COVID-19) pandemic",
    venue: null,
    doi: null,
    url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019",
  },
  {
    style: "apa",
    families: ["Keo", "Sam", "Lan", "Rouet"],
    etAl: false,
    year: 2025,
    title:
      "Students’ perceptions and effects of technology integration in English learning: A case study at National University of Battambang",
    venue: "Journal of English and Education (JEE)",
    doi: "10.20885/jee.v11i1.37268",
    url: null,
  },
  {
    style: "ieee",
    families: ["Vaswani", "Shazeer", "Parmar", "Uszkoreit", "Jones", "Gomez", "Kaiser", "Polosukhin"],
    etAl: false,
    year: 2017,
    title: "Attention is all you need",
    venue: "arXiv preprint arXiv:1706.03762",
    doi: null,
    url: "https://arxiv.org/abs/1706.03762",
  },
  {
    style: "ieee",
    families: ["Schmidhuber"],
    etAl: false,
    year: 2015,
    title: "Deep learning in neural networks: An overview",
    venue: "Neural Networks",
    doi: "10.1016/j.neunet.2014.09.003",
    url: null,
  },
];

const fixtureEntries = splitEntries(
  readFileSync(join(__dirname, "../fixtures/references.txt"), "utf8"),
);

describe("parseReference on the real fixture list", () => {
  it("has one expectation per fixture entry", () => {
    expect(fixtureEntries).toHaveLength(EXPECTED.length);
  });

  describe.each(EXPECTED.map((expected, i) => ({ no: i + 1, raw: fixtureEntries[i], expected })))(
    "entry $no",
    ({ raw, expected }) => {
      const parsed = parseReference(raw);

      it("keeps the raw text", () => expect(parsed.raw).toBe(raw));
      it("detects the citation style", () => expect(parsed.style).toBe(expected.style));
      it("extracts every author's family name in order", () =>
        expect(parsed.authors.map((a) => a.family)).toEqual(expected.families));
      it("flags et al. correctly", () => expect(parsed.etAl).toBe(expected.etAl));
      it("extracts the year", () => expect(parsed.year).toBe(expected.year));
      it("extracts the title", () => expect(parsed.title).toBe(expected.title));
      it("extracts the venue", () => expect(parsed.venue).toBe(expected.venue));
      it("extracts the DOI", () => expect(parsed.doi).toBe(expected.doi));
      it("extracts a non-DOI URL", () => expect(parsed.url).toBe(expected.url));
    },
  );
});

describe("parseReference hard cases", () => {
  it("attaches APA initials to the right author and keeps one-word Indonesian names", () => {
    const parsed = parseReference(
      "Dilasani, R., Sudiran, & Hartono. (2025). Judul. Jurnal, 1(1), 1–2.",
    );
    expect(parsed.authors).toEqual([
      { family: "Dilasani", given: "R." },
      { family: "Sudiran", given: null },
      { family: "Hartono", given: null },
    ]);
  });

  it("keeps multi-letter APA initials together", () => {
    const parsed = parseReference("Pravitasari, H., & Fatihah, I. N. K. (2025). Judul. Jurnal, 1, 1.");
    expect(parsed.authors[1]).toEqual({ family: "Fatihah", given: "I. N. K." });
  });

  it("splits IEEE initials from the family name, keeping diacritics", () => {
    const parsed = parseReference("A. N. Gomez and Ł. Kaiser, “Title,” Journal, 2017.");
    expect(parsed.authors).toEqual([
      { family: "Gomez", given: "A. N." },
      { family: "Kaiser", given: "Ł." },
    ]);
  });

  it("reads a DOI written as doi.org URL, dx.doi.org URL, or doi: prefix the same way", () => {
    const base = "Smith, J. (2020). Title. Journal, 1, 1.";
    expect(parseReference(`${base} https://doi.org/10.1000/ABC.1`).doi).toBe("10.1000/abc.1");
    expect(parseReference(`${base} http://dx.doi.org/10.1000/abc.1`).doi).toBe("10.1000/abc.1");
    expect(parseReference(`${base} doi: 10.1000/abc.1.`).doi).toBe("10.1000/abc.1");
  });

  it("accepts APA year suffixes like 2020a", () => {
    expect(parseReference("Smith, J. (2020a). Title. Journal, 1, 1.").year).toBe(2020);
  });

  it("treats the Indonesian no-date marker (t.t.) like (n.d.)", () => {
    const parsed = parseReference("Kemendikbud. (t.t.). Panduan literasi digital. https://example.org/panduan");
    expect(parsed.style).toBe("apa");
    expect(parsed.year).toBeNull();
    expect(parsed.title).toBe("Panduan literasi digital");
  });

  it("does not mistake page numbers for the IEEE year", () => {
    const parsed = parseReference("A. Author, “Title,” in Proc. Conf., 2020, pp. 1877–1901.");
    expect(parsed.year).toBe(2020);
  });

  it("does not cut a colon title short", () => {
    expect(parseReference("Smith, J. (2020). Main title: A subtitle. Journal, 1, 1.").title).toBe(
      "Main title: A subtitle",
    );
  });

  it("does not end an APA title at initialisms like U.S.", () => {
    const parsed = parseReference("Smith, J. (2020). The U.S. response to AI: A review. Policy Journal, 3(1), 1–9.");
    expect(parsed.title).toBe("The U.S. response to AI: A review");
    expect(parsed.venue).toBe("Policy Journal");
  });

  it("does not end an APA title at common abbreviations like e.g.", () => {
    const parsed = parseReference("Smith, J. (2020). Effects of vitamins (e.g. vitamin D) on sleep. Sleep Journal, 4, 1–2.");
    expect(parsed.title).toBe("Effects of vitamins (e.g. vitamin D) on sleep");
    expect(parsed.venue).toBe("Sleep Journal");
  });

  it("does not end an APA title at vs.", () => {
    const parsed = parseReference("Smith, J. (2020). Python vs. Java for beginners. Edu Journal, 1, 1.");
    expect(parsed.title).toBe("Python vs. Java for beginners");
  });

  it("falls back to style 'unknown' without throwing, still keeping the DOI", () => {
    const parsed = parseReference("Some free text about a paper 10.1000/xyz123");
    expect(parsed.style).toBe("unknown");
    expect(parsed.authors).toEqual([]);
    expect(parsed.title).toBeNull();
    expect(parsed.doi).toBe("10.1000/xyz123");
  });

  it("handles an empty string", () => {
    const parsed = parseReference("");
    expect(parsed.style).toBe("unknown");
    expect(parsed.doi).toBeNull();
  });
});
