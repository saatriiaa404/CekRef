// One-off: npm run crossref:record
// Runs the real pipeline against the live Crossref API for tests/fixtures/references.txt and saves
// the (trimmed) responses to tests/fixtures/crossref/cache.json, so integration tests run offline.
// Sends no contact email: the fixtures are recorded anonymously.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { checkReferences } from "../src/engine/check";
import { createCrossrefClient, type CachedResponse } from "../src/lib/crossref";
import { createMemoryCache } from "../src/lib/memory-cache";

const ROOT = join(__dirname, "..");
const INPUT = join(ROOT, "tests/fixtures/references.txt");
const OUTPUT = join(ROOT, "tests/fixtures/crossref/cache.json");

const KEEP = ["DOI", "title", "author", "issued", "published-print", "published-online", "published", "container-title"];

function trimWork(work: unknown): unknown {
  if (typeof work !== "object" || work === null) return work;
  const source = work as Record<string, unknown>;
  const trimmed: Record<string, unknown> = {};
  for (const key of KEEP) if (key in source) trimmed[key] = source[key];
  if (Array.isArray(trimmed.author)) {
    trimmed.author = (trimmed.author as Array<Record<string, unknown>>).map(({ given, family, name }) => ({ given, family, name }));
  }
  return trimmed;
}

function trimEntry(key: string, entry: CachedResponse): CachedResponse {
  if (entry.status !== 200 || entry.body === null) return entry;
  if (key.startsWith("query:")) {
    const items = (entry.body as { items?: unknown[] }).items ?? [];
    return { status: 200, body: { items: items.map(trimWork) } };
  }
  return { status: 200, body: trimWork(entry.body) };
}

async function main(): Promise<void> {
  const cache = createMemoryCache();
  const crossref = createCrossrefClient({ cache, mailto: "" });
  const results = await checkReferences(readFileSync(INPUT, "utf8"), {
    crossref,
    onProgress: (done, total) => process.stderr.write(`\rMerekam ${done}/${total}...`),
  });
  process.stderr.write("\n");

  if (results.some((r) => r.reasons.some((reason) => reason.startsWith("Crossref tidak dapat dihubungi")))) {
    console.error("Sebagian permintaan gagal; file tidak ditulis. Coba lagi.");
    process.exit(1);
  }

  const entries = Object.entries(cache.toJSON()).sort(([a], [b]) => a.localeCompare(b));
  const output = Object.fromEntries(entries.map(([key, entry]) => [key, trimEntry(key, entry)]));
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Tersimpan ${entries.length} respons ke ${OUTPUT}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
