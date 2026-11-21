// CLI: npm run check -- <file.txt>
// Runs the full pipeline on a reference list and prints the results (uses .env: DEMO_MODE, CROSSREF_MAILTO).
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { checkReferences } from "../src/engine/check";
import { LABEL_TEXT } from "../src/engine/classifier";
import type { CheckResult } from "../src/engine/types";
import { createCrossrefFromEnv, crossrefOptionsFromEnv } from "../src/lib/crossref-env";

const LOOKUP_TEXT = { doi: "lewat DOI", search: "lewat pencarian", none: "tanpa pencarian" } as const;

function printResult(result: CheckResult, index: number): void {
  const source = [LOOKUP_TEXT[result.lookup], result.fromCache ? "dari cache" : null].filter(Boolean).join(", ");
  console.log(`[${index + 1}] ${LABEL_TEXT[result.label]} (skor ${Math.round(result.score * 100)}%) · ${source}`);
  console.log(`    Input   : ${result.parsed.title ?? result.parsed.raw}`);
  if (result.best) {
    console.log(`    Database: ${result.best.title ?? "-"}${result.best.doi ? ` (https://doi.org/${result.best.doi})` : ""}`);
  }
  for (const reason of result.reasons) console.log(`    - ${reason}`);
  console.log();
}

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) {
    console.error("Cara pakai: npm run check -- <file.txt>");
    process.exit(1);
  }
  if (!existsSync(file)) {
    console.error(`File tidak ditemukan: ${file}`);
    process.exit(1);
  }

  const { demoMode } = crossrefOptionsFromEnv(process.env);
  console.error(demoMode ? "DEMO_MODE aktif: hanya membaca cache, tanpa internet." : "Memeriksa ke Crossref...");

  const crossref = await createCrossrefFromEnv();
  const results = await checkReferences(readFileSync(file, "utf8"), {
    crossref,
    onProgress: (done, total) => process.stderr.write(`\rMemeriksa ${done} dari ${total} referensi...`),
  });
  process.stderr.write("\n\n");

  results.forEach(printResult);

  const count = (label: CheckResult["label"]) => results.filter((r) => r.label === label).length;
  console.log(
    `Ringkasan: ${count("match")} ${LABEL_TEXT.match}, ${count("partial")} ${LABEL_TEXT.partial}, ` +
      `${count("not_found")} ${LABEL_TEXT.not_found} (total ${results.length}).`,
  );

  const { db } = await import("../src/lib/db");
  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error("Terjadi kesalahan:", error);
  process.exit(1);
});
