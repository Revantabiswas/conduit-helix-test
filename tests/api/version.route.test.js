// API & Contract tests for GET /api/version (Story 1.1, KAN-28), against the real backend/index.js app.
import { describe, it, expect, beforeAll } from "vitest";
import { createRequire } from "node:module";
import http from "node:http";
import path from "node:path";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, "../..");
const pkg = require(path.join(repoRoot, "backend/package.json"));

function call(port, urlPath, { method = "GET", headers = {} } = {}) {
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

let port;
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.TEST_DB_DIALECT = "postgres";
  process.env.TEST_DB_HOSTNAME = "127.0.0.1";
  process.env.TEST_DB_NAME = "unused";
  process.env.TEST_DB_USERNAME = "unused";
  process.env.TEST_DB_PASSWORD = "unused";
  process.env.TEST_DB_LOGGING = "";
  process.env.PORT = String(20000 + Math.floor(Math.random() * 15000));
  port = Number(process.env.PORT);
  require(path.join(repoRoot, "backend/index.js"));
  for (let i = 0; i < 50; i++) {
    try {
      await call(port, "/");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("backend did not start");
});

describe("GET /api/version", () => {
  it("functional: 200 with the contract body", async () => {
    const res = await call(port, "/api/version");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^application\/json/);
    expect(JSON.parse(res.body)).toEqual({ name: "conduit", version: pkg.version });
  });

  it("response contract: exactly two string fields", async () => {
    const body = JSON.parse((await call(port, "/api/version")).body);
    expect(Object.keys(body).sort()).toEqual(["name", "version"]);
    expect(typeof body.name).toBe("string");
    expect(typeof body.version).toBe("string");
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("authorization: public, so no 401/403 with no credentials or with an invalid token", async () => {
    const anon = await call(port, "/api/version");
    const bad = await call(port, "/api/version", { headers: { Authorization: "Token not-a-real-token" } });
    expect([anon.status, bad.status]).toEqual([200, 200]);
  });

  it("request validation: query parameters are ignored and never reflected", async () => {
    const res = await call(port, "/api/version?version=evil&name=%3Cscript%3E");
    expect(JSON.parse(res.body)).toEqual({ name: "conduit", version: pkg.version });
    expect(res.body).not.toContain("evil");
  });

  it("response codes: only GET is served on /api/version", async () => {
    for (const method of ["POST", "PUT", "DELETE"]) {
      const res = await call(port, "/api/version", { method });
      expect(res.status).not.toBe(200);
    }
  });

  it("error response: unknown paths keep the standard 404 body", async () => {
    const res = await call(port, "/api/unknown-path");
    expect(res.status).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ errors: { body: ["Not found"] } });
  });
});
