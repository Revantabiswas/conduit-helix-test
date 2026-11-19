// Step definitions for spec/behavior/story-1.1.feature (KAN-28 GET /api/version).
// Bound to the public HTTP surface of the backend (real backend/index.js app) and to
// backend/package.json — never to internals.
import { Given, When, Then, Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const pkg = require(path.join(repoRoot, "backend/package.json"));

let port;
function call(urlPath, { method = "GET", headers = {}, onPort } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: onPort ?? port, path: urlPath, method, headers, agent: new http.Agent() },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

let server;
BeforeAll(async function () {
  port = 30000 + Math.floor(Math.random() * 15000);
  // Run the real backend as its own process (it listens at load and exports nothing), so the
  // behaviour run can shut it down and exit cleanly. No database is needed for these scenarios.
  server = spawn(process.execPath, [path.join(repoRoot, "backend/index.js")], {
    cwd: path.join(repoRoot, "backend"),
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      TEST_DB_DIALECT: "postgres",
      TEST_DB_HOSTNAME: "127.0.0.1",
      TEST_DB_NAME: "unused",
      TEST_DB_USERNAME: "unused",
      TEST_DB_PASSWORD: "unused",
      TEST_DB_LOGGING: "",
    },
    stdio: "ignore",
  });
  for (let i = 0; i < 100; i++) {
    try {
      await call("/");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("backend did not start");
});

AfterAll(function () {
  if (server) server.kill();
});

let state;
Before(function () {
  state = { headers: {}, response: null };
});

Given("the Conduit backend is running", async function () {
  const res = await call("/");
  assert.ok(res.status >= 100);
});

Given(/^backend\/package\.json declares version "([^"]*)"$/, async function (declared) {
  state.declared = declared;
  if (declared === pkg.version) return; // the real backend already serves this value
  // A different declared version: start the real version router next to a package.json that
  // declares it, so the scenario proves the value comes from the file and nothing else.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "version-declared-"));
  fs.mkdirSync(path.join(dir, "routes"));
  fs.copyFileSync(path.join(repoRoot, "backend/routes/version.js"), path.join(dir, "routes/version.js"));
  fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "backend", version: declared }));
  const altPort = 45000 + Math.floor(Math.random() * 10000);
  const script =
    `const express=require("express");const app=express();` +
    `app.use("/api/version",require(process.argv[1]));app.listen(${altPort},"127.0.0.1");`;
  state.alt = {
    dir,
    port: altPort,
    child: spawn(process.execPath, ["-e", script, path.join(dir, "routes/version.js")], {
      env: { ...process.env, NODE_PATH: path.join(repoRoot, "node_modules") },
      stdio: "ignore",
    }),
  };
  for (let i = 0; i < 50; i++) {
    try {
      await call("/api/version", { onPort: altPort });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("alternate version server did not start");
});

After(function () {
  if (state?.alt) {
    state.alt.child.kill();
    fs.rmSync(state.alt.dir, { recursive: true, force: true });
  }
});

Given("the request carries no Authorization header", function () {
  state.headers = {};
});

Given(/^backend\/package\.json is missing or unreadable$/, function () {
  state.pkgMissing = true;
});

When(/^a client sends GET \/api\/version$/, async function () {
  state.response = await call("/api/version", { headers: state.headers, onPort: state.alt?.port });
});

Then(/^the response status is (\d+)$/, function (code) {
  assert.equal(state.response.status, Number(code));
});

Then("the response content type is JSON", function () {
  assert.match(state.response.headers["content-type"], /application\/json/);
});

Then(/^the response body is exactly (\{.*\})$/, function (json) {
  const expected = JSON.parse(json);
  // The feature quotes the checked-in version value; the live value must equal package.json.
  assert.equal(expected.name, "conduit");
  assert.deepEqual(JSON.parse(state.response.body), { name: "conduit", version: state.declared ?? pkg.version });
  assert.deepEqual(expected, { name: "conduit", version: state.declared });
});

Then(/^the response body has exactly 2 fields, "name" and "version"$/, function () {
  assert.deepEqual(Object.keys(JSON.parse(state.response.body)).sort(), ["name", "version"]);
});

// AC-2: version matches package.json (the scenario sets an example value; the live proof is that
// the served value equals what package.json declares at start-up).
When(/^the backend starts and a client sends GET \/api\/version$/, async function () {
  state.response = await call("/api/version", { onPort: state.alt?.port });
});

Then(/^the response body version is "([^"]*)"$/, function (expectedVersion) {
  assert.equal(expectedVersion, state.declared);
  assert.equal(JSON.parse(state.response.body).version, expectedVersion);
});

When("the backend starts", function () {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "version-start-"));
  fs.mkdirSync(path.join(dir, "routes"));
  fs.copyFileSync(path.join(repoRoot, "backend/routes/version.js"), path.join(dir, "routes/version.js"));
  state.start = spawnSync(
    process.execPath,
    ["-e", `require(${JSON.stringify(path.join(dir, "routes/version.js"))})`],
    { env: { ...process.env, NODE_PATH: path.join(repoRoot, "node_modules") }, encoding: "utf8" },
  );
  fs.rmSync(dir, { recursive: true, force: true });
});

Then(/^startup fails with an error$/, function () {
  assert.notEqual(state.start.status, 0);
  assert.match(state.start.stderr, /Cannot find module/);
});

Then("no request is served with a wrong version", function () {
  // The module threw while loading, so no router (and thus no version response) exists for it.
  assert.notEqual(state.start.status, 0);
});

Then("the response status is not 404", function () {
  assert.notEqual(state.response.status, 404);
});

Then(
  /^a GET to an unknown path such as \/api\/unknown still returns 404 with (\{.*\})$/,
  async function (json) {
    const res = await call("/api/unknown");
    assert.equal(res.status, 404);
    assert.deepEqual(JSON.parse(res.body), JSON.parse(json));
  },
);

When(/^the repository's vitest suite for tests\/unit\/backend runs$/, function () {
  state.vitest = spawnSync(
    "npx",
    ["vitest", "run", "--config", "vitest.src.config.js", "tests/unit/backend/routes/version.test.js"],
    { cwd: repoRoot, encoding: "utf8", env: { ...process.env, CI: "1" } },
  );
});

Then(
  /^the version unit test at tests\/unit\/backend\/routes\/version\.test\.js passes and asserts status, JSON content type, exact body, package\.json match and no credentials$/,
  function () {
    assert.equal(state.vitest.status, 0, state.vitest.stdout + state.vitest.stderr);
    const src = fs.readFileSync(path.join(repoRoot, "tests/unit/backend/routes/version.test.js"), "utf8");
    for (const needle of ["toBe(200)", "application\\/json", "toEqual({ name: \"conduit\"", "Authorization"]) {
      assert.ok(src.includes(needle), `unit test should assert ${needle}`);
    }
  },
);

When("the change is reviewed", function () {
  const base = spawnSync("git", ["merge-base", "HEAD", "origin/epic/KAN-25-backend-version-endpoint"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout.trim();
  state.depDiff = spawnSync("git", ["diff", base, "--", "package.json", "backend/package.json", "frontend/package.json", "package-lock.json"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout;
});

Then("no package.json dependency or devDependency differs from before", function () {
  assert.equal(state.depDiff.trim(), "");
});

Then(/^GET \/api\/tags still responds as before$/, async function () {
  const res = await call("/api/tags");
  // Without a database the route returns the error handler's response, not the version route's.
  assert.notDeepEqual(res.status, 404);
  assert.ok(!res.body.includes('"version"'));
});
