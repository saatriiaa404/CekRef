import { describe, expect, it } from "vitest";
import { crossrefOptionsFromEnv } from "@/lib/crossref-env";
import { createMemoryCache } from "@/lib/memory-cache";

describe("crossrefOptionsFromEnv", () => {
  it("reads CROSSREF_MAILTO and DEMO_MODE", () => {
    expect(crossrefOptionsFromEnv({ CROSSREF_MAILTO: " tim@contoh.ac.id ", DEMO_MODE: "true" })).toEqual({
      mailto: "tim@contoh.ac.id",
      demoMode: true,
    });
  });

  it("treats anything other than 'true' as demo mode off", () => {
    expect(crossrefOptionsFromEnv({ DEMO_MODE: "false" }).demoMode).toBe(false);
    expect(crossrefOptionsFromEnv({ DEMO_MODE: "1" }).demoMode).toBe(false);
    expect(crossrefOptionsFromEnv({}).demoMode).toBe(false);
  });

  it("accepts DEMO_MODE in any letter case", () => {
    expect(crossrefOptionsFromEnv({ DEMO_MODE: "TRUE" }).demoMode).toBe(true);
  });

  it("leaves mailto empty when it is not configured", () => {
    expect(crossrefOptionsFromEnv({}).mailto).toBe("");
  });
});

describe("createMemoryCache", () => {
  it("starts from the given entries and exports what it holds", async () => {
    const cache = createMemoryCache({ "doi:10.1/a": { status: 404, body: null } });
    await cache.set("doi:10.1/b", { status: 200, body: { title: ["B"] } });
    expect(await cache.get("doi:10.1/a")).toEqual({ status: 404, body: null });
    expect(await cache.get("doi:10.1/missing")).toBeNull();
    expect(cache.toJSON()).toEqual({
      "doi:10.1/a": { status: 404, body: null },
      "doi:10.1/b": { status: 200, body: { title: ["B"] } },
    });
  });
});
