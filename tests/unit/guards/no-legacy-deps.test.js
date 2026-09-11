// Guard test (Story 1.9, REQ-F-27 / REQ-F-30 / REQ-NF-05 / ARCH-06): no file under src/
// imports axios or react-router-dom. This enforces the Axios-service-layer elimination and
// the React-Router elimination for the whole migrated app.

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const srcDir = fileURLToPath(new URL("../../../src", import.meta.url));

describe("no legacy dependencies in src/", () => {
  const files = walk(srcDir);

  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no src/ file imports axios (REQ-NF-05, ARCH-06)", () => {
    const offenders = files.filter((f) =>
      /from\s+['"]axios['"]|require\(\s*['"]axios['"]\s*\)/.test(
        readFileSync(f, "utf8"),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it("no src/ file imports react-router-dom (REQ-F-30, ARCH-06)", () => {
    const offenders = files.filter((f) =>
      /from\s+['"]react-router-dom['"]|require\(\s*['"]react-router-dom['"]\s*\)/.test(
        readFileSync(f, "utf8"),
      ),
    );
    expect(offenders).toEqual([]);
  });

  it("no src/ file is TypeScript (REQ-NF-07: no TS migration)", () => {
    const ts = walk(srcDir).filter(() => false); // walk only collects .js/.jsx
    // Additionally assert no .ts/.tsx exist by re-scanning.
    const allTs = [];
    (function scan(dir) {
      for (const e of readdirSync(dir)) {
        const full = join(dir, e);
        if (statSync(full).isDirectory()) scan(full);
        else if (/\.(ts|tsx)$/.test(e)) allTs.push(full);
      }
    })(srcDir);
    expect(ts).toEqual([]);
    expect(allTs).toEqual([]);
  });
});
