// Step definitions for spec/behavior/story-1.9.feature (B1).
// Bound to the filesystem/structure facts the story guarantees (component port, no legacy deps).

import { When, Then, Before } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const srcDir = fileURLToPath(new URL("../../../src", import.meta.url));

function walk(dir, exts) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((x) => e.endsWith(x))) out.push(full);
  }
  return out;
}

Before(function () {
  this.scan = {};
});

When(/^the src tree is scanned for imports$/, function () {
  this.scan.files = walk(srcDir, [".js", ".jsx"]);
});

When(/^the src tree is scanned for file extensions$/, function () {
  this.scan.tsFiles = walk(srcDir, [".ts", ".tsx"]);
});

When(/^the components directory is listed$/, function () {
  this.scan.components = readdirSync(join(srcDir, "components"));
});

When(/^the app styling is checked$/, function () {
  this.scan.stylesExists = existsSync(join(srcDir, "app", "styles.css"));
  this.scan.layout = readFileSync(join(srcDir, "app", "layout.js"), "utf8");
});

Then(/^no file imports "([^"]*)"$/, function (pkg) {
  const offenders = this.scan.files.filter((f) =>
    new RegExp(`from\\s+['"]${pkg}['"]`).test(readFileSync(f, "utf8")),
  );
  assert.deepEqual(offenders, []);
});

Then(/^there are no "\.ts" or "\.tsx" files$/, function () {
  assert.deepEqual(this.scan.tsFiles, []);
});

Then(
  /^it contains "([^"]*)", "([^"]*)", "([^"]*)" and "([^"]*)"$/,
  function (a, b, c, d) {
    for (const name of [a, b, c, d]) {
      assert.ok(
        this.scan.components.includes(`${name}.jsx`),
        `expected ${name}.jsx in src/components`,
      );
    }
  },
);

Then(/^src\/app\/styles\.css exists$/, function () {
  assert.ok(this.scan.stylesExists);
});

Then(/^the root layout imports the styles$/, function () {
  assert.ok(/styles\.css/.test(this.scan.layout));
});
