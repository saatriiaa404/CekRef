import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { splitEntries } from "@/engine/splitter";

const fixture = readFileSync(join(__dirname, "../fixtures/references.txt"), "utf8");

describe("splitEntries", () => {
  it("splits the fixture file on blank lines into 15 entries", () => {
    const entries = splitEntries(fixture);
    expect(entries).toHaveLength(15);
    expect(entries[0]).toMatch(/^Dilasani, R\./);
    expect(entries[14]).toMatch(/^J\. Schmidhuber/);
  });

  it("returns an empty list for blank input", () => {
    expect(splitEntries("  \n\n \t\n")).toEqual([]);
  });

  it("splits on IEEE [n] markers and removes them", () => {
    const text = "[1] A. Author, “First,” J, 2020.\n[2] B. Author, “Second,” J, 2021.";
    expect(splitEntries(text)).toEqual([
      "A. Author, “First,” J, 2020.",
      "B. Author, “Second,” J, 2021.",
    ]);
  });

  it("joins lines wrapped inside an [n] entry", () => {
    const text = "[1] A. Author, “A very long\ntitle,” Journal, 2020.\n[2] B. Author, “Short,” J, 2021.";
    expect(splitEntries(text)).toEqual([
      "A. Author, “A very long title,” Journal, 2020.",
      "B. Author, “Short,” J, 2021.",
    ]);
  });

  it("splits on '1.' style numbering and removes the numbers", () => {
    const text = "1. Smith, J. (2020). One. J.\n2. Doe, A. (2021). Two. J.";
    expect(splitEntries(text)).toEqual(["Smith, J. (2020). One. J.", "Doe, A. (2021). Two. J."]);
  });

  it("does not treat a wrapped line starting with a year as numbering", () => {
    const text = "1. Smith, J. (2020). Title. Journal, 3,\n2015. More text.\n2. Doe, A. (2021). Two. J.";
    expect(splitEntries(text)).toEqual([
      "Smith, J. (2020). Title. Journal, 3, 2015. More text.",
      "Doe, A. (2021). Two. J.",
    ]);
  });

  it("joins lines wrapped inside a blank-line-separated entry", () => {
    const text = "Smith, J. (2020). A long\ntitle. Journal.\n\nDoe, A. (2021). Two. J.";
    expect(splitEntries(text)).toEqual(["Smith, J. (2020). A long title. Journal.", "Doe, A. (2021). Two. J."]);
  });

  it("treats each line as an entry when there are no blank lines or markers", () => {
    const text = "Smith, J. (2020). One. J.\nDoe, A. (2021). Two. J.";
    expect(splitEntries(text)).toEqual(["Smith, J. (2020). One. J.", "Doe, A. (2021). Two. J."]);
  });

  it("handles Windows line endings", () => {
    const text = "Smith, J. (2020). One. J.\r\n\r\nDoe, A. (2021). Two. J.\r\n";
    expect(splitEntries(text)).toEqual(["Smith, J. (2020). One. J.", "Doe, A. (2021). Two. J."]);
  });

  it("collapses repeated spaces inside an entry", () => {
    expect(splitEntries("Smith,   J.  (2020).\tOne.")).toEqual(["Smith, J. (2020). One."]);
  });
});
