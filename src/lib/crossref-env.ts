// Builds the Crossref client from environment variables (.env).
import { createPrismaCache } from "./cache";
import { createCrossrefClient, type CacheStore, type CrossrefClient } from "./crossref";

type Env = Record<string, string | undefined>;

/** CROSSREF_MAILTO -> polite-pool contact; DEMO_MODE=true -> cache only, no network. */
export function crossrefOptionsFromEnv(env: Env): { mailto: string; demoMode: boolean } {
  return {
    mailto: (env.CROSSREF_MAILTO ?? "").trim(),
    demoMode: (env.DEMO_MODE ?? "").trim().toLowerCase() === "true",
  };
}

/** Client for the app and CLI: SQLite-backed cache unless another cache is given. */
export async function createCrossrefFromEnv(cache?: CacheStore, env: Env = process.env): Promise<CrossrefClient> {
  // Imported lazily so code that only needs crossrefOptionsFromEnv does not open the database.
  const store = cache ?? createPrismaCache((await import("./db")).db);
  return createCrossrefClient({ cache: store, ...crossrefOptionsFromEnv(env) });
}
