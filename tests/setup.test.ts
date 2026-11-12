// Smoke test: proves the test runner and the "@/" path alias are wired up.
// Real engine tests live in tests/engine/ starting from Phase 1.
import { describe, expect, it } from "vitest";
import { config } from "@/config";

describe("project setup", () => {
  it("resolves modules through the @/ alias", () => {
    expect(config).toBeDefined();
  });
});
