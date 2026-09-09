// Unit test for the shared slugify helper (Story 1.2 ships the module; REQ-F-16).

import { describe, it, expect } from "vitest";
import { slugify } from "../../../src/lib/helpers.js";

describe("slugify", () => {
  it("lowercases, trims, and replaces non-word chars with hyphens", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
    expect(slugify("A Great_Title!")).toBe("a-great-title-");
    expect(slugify("Multiple   Spaces")).toBe("multiple---spaces");
  });
});
