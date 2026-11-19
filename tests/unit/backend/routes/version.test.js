// Unit tests for GET /api/version (Story 1.1, KAN-28).
import { describe, it, expect, beforeAll } from "vitest";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const pkg = require(path.join(repoRoot, "backend/package.json"));

// A fresh agent bypasses any proxy configured for the global agent (the target is 127.0.0.1).
function get(port, urlPath, { method = "GET", headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: urlPath, method, headers, agent: new http.Agent() },
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

describe("backend/routes/version.js (router in isolation)", () => {
  let port;
  beforeAll(async () => {
    const express = require("express");
    const versionRouter = require(path.join(repoRoot, "backend/routes/version.js"));
    const app = express();
    app.use("/api/version", versionRouter);
    const server = http.createServer(app);
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    port = server.address().port;
    return () => new Promise((r) => server.close(r));
  });

  it("returns 200 JSON with exactly name and version", async () => {
    const res = await get(port, "/api/version");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(JSON.parse(res.body)).toEqual({ name: "conduit", version: pkg.version });
    expect(Object.keys(JSON.parse(res.body))).toEqual(["name", "version"]);
  });

  it("serves the version declared in backend/package.json (no hardcoded copy)", async () => {
    const res = await get(port, "/api/version");
    expect(JSON.parse(res.body).version).toBe(pkg.version);
    const source = fs.readFileSync(path.join(repoRoot, "backend/routes/version.js"), "utf8");
    expect(source).not.toContain(`"${pkg.version}"`);
    expect(source).toMatch(/require\("\.\.\/package\.json"\)/);
  });

  it("needs no credentials and ignores a garbage Authorization header", async () => {
    const anon = await get(port, "/api/version");
    const junk = await get(port, "/api/version", { headers: { Authorization: "Token not-a-real-token" } });
    expect(anon.status).toBe(200);
    expect(junk.status).toBe(200);
    expect(junk.body).toBe(anon.body);
  });

  it("does not reflect query input and serves only GET", async () => {
    const q = await get(port, "/api/version?name=%3Cscript%3E&version=evil");
    expect(JSON.parse(q.body)).toEqual({ name: "conduit", version: pkg.version });
    const post = await get(port, "/api/version", { method: "POST" });
    expect(post.status).not.toBe(200);
  });

  it("does not depend on auth middleware or models", () => {
    const source = fs.readFileSync(path.join(repoRoot, "backend/routes/version.js"), "utf8");
    expect(source).not.toMatch(/verifyToken|models|sequelize|controllers/);
  });
});

describe("backend startup without a readable package.json", () => {
  it("fails at load instead of serving a wrong version", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "version-route-"));
    fs.mkdirSync(path.join(dir, "routes"));
    fs.copyFileSync(path.join(repoRoot, "backend/routes/version.js"), path.join(dir, "routes/version.js"));
    const res = spawnSync(process.execPath, ["-e", `require(${JSON.stringify(path.join(dir, "routes/version.js"))})`], {
      env: { ...process.env, NODE_PATH: path.join(repoRoot, "node_modules") },
      encoding: "utf8",
    });
    fs.rmSync(dir, { recursive: true, force: true });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/Cannot find module '\.\.\/package\.json'/);
  });
});

describe("backend/index.js (the real app)", () => {
  let port;
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    // The app builds its Sequelize client at load; a dialect is required but no database is needed
    // (the startup sync failure is caught and logged by backend/index.js).
    process.env.TEST_DB_DIALECT = "postgres";
    process.env.TEST_DB_HOSTNAME = "127.0.0.1";
    process.env.TEST_DB_NAME = "unused";
    process.env.TEST_DB_USERNAME = "unused";
    process.env.TEST_DB_PASSWORD = "unused";
    process.env.TEST_DB_LOGGING = "";
    process.env.PORT = String(40000 + Math.floor(Math.random() * 20000));
    port = Number(process.env.PORT);
    require(path.join(repoRoot, "backend/index.js"));
    for (let i = 0; i < 50; i++) {
      try {
        await get(port, "/api/version");
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    throw new Error("backend did not start");
  });

  it("serves /api/version with 200 and the package.json version", async () => {
    const res = await get(port, "/api/version");
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ name: "conduit", version: pkg.version });
  });

  it("mounts the version route before the catch-all 404 while unknown paths still 404", async () => {
    const unknown = await get(port, "/api/unknown-path");
    expect(unknown.status).toBe(404);
    expect(JSON.parse(unknown.body)).toEqual({ errors: { body: ["Not found"] } });
    const source = fs.readFileSync(path.join(repoRoot, "backend/index.js"), "utf8");
    expect(source.indexOf('app.use("/api/version"')).toBeGreaterThan(-1);
    expect(source.indexOf('app.use("/api/version"')).toBeLessThan(source.indexOf('app.get("/*any"'));
  });
});
