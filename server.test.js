"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { after, before, test } = require("node:test");
const { createServer } = require("./server");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const server = createServer();
let baseUrl;
const fixtureTag = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const staticFixtures = {};

async function createFixtureIfDirectoryExists(directoryName, extension, contents) {
  const directory = path.join(__dirname, directoryName);
  try {
    if (!(await fs.promises.stat(directory)).isDirectory()) return null;
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }

  const filePath = path.join(directory, `server-test-${fixtureTag}.${extension}`);
  await fs.promises.writeFile(filePath, contents, { flag: "wx" });
  return filePath;
}

before(async () => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  staticFixtures.css = await createFixtureIfDirectoryExists("css", "css", "/* css fixture */\n");
  staticFixtures.js = await createFixtureIfDirectoryExists("js", "js", "// js fixture\n");
  staticFixtures.png = await createFixtureIfDirectoryExists("docs", "png", Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

after(async () => {
  await Promise.all(Object.values(staticFixtures).filter(Boolean).map(filePath =>
    fs.promises.rm(filePath, { force: true })
  ));
  await new Promise(resolve => {
    server.close(resolve);
    server.closeAllConnections?.();
  });
});

async function request(url, options = {}) {
  const response = await fetch(`${baseUrl}${url}`, options);
  let body;
  if (response.headers.get("content-type")?.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }
  return { response, body };
}

async function login(user = "demo", pass = "demo") {
  const result = await request("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user, pass }),
  });
  return result;
}

function rawGet(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port: server.address().port,
      method: "GET",
      path: urlPath,
    }, res => {
      const chunks = [];
      res.on("data", chunk => chunks.push(chunk));
      res.on("end", () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString("utf8"),
      }));
    });
    req.once("error", reject);
    req.end();
  });
}

test("login accepts demo credentials and rejects incorrect credentials", async () => {
  const success = await login();
  assert.equal(success.response.status, 200);
  assert.match(success.body.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(success.response.headers.get("cache-control"), "no-store");

  const failure = await login("demo", "wrong");
  assert.equal(failure.response.status, 401);
  assert.deepEqual(failure.body, { error: "bad credentials" });
});

test("protected endpoints require a valid bearer token", async () => {
  for (const url of ["/api/transactions?persona=maya", "/api/prefs"]) {
    const { response } = await request(url);
    assert.equal(response.status, 401);
  }
  const invalid = await request("/api/prefs", { headers: { authorization: "Bearer invalid" } });
  assert.equal(invalid.response.status, 401);
});

test("transactions preserve the data file shape and reject unknown personas", async () => {
  const { body: session, response: loginResponse } = await login();
  assert.equal(loginResponse.status, 200);
  const headers = { authorization: `Bearer ${session.token}` };

  for (const [persona, expected] of Object.entries(data)) {
    const { response, body } = await request(`/api/transactions?persona=${persona}`, { headers });
    assert.equal(response.status, 200);
    assert.deepEqual(body, { tx: expected.tx });
  }

  for (const persona of ["unknown", "constructor", "__proto__"]) {
    const { response, body } = await request(`/api/transactions?persona=${encodeURIComponent(persona)}`, { headers });
    assert.equal(response.status, 404);
    assert.deepEqual(body, { error: "no persona" });
  }
});

test("preferences round trip per session and reject invalid JSON or shapes", async () => {
  const first = await login();
  const firstHeaders = { authorization: `Bearer ${first.body.token}` };
  const initial = await request("/api/prefs", { headers: firstHeaders });
  assert.equal(initial.response.status, 200);
  assert.deepEqual(initial.body, {});

  const prefs = {
    types: { dining: true, domestic: false },
    hidden: ["maya|city|Nashville"],
    refunded: [],
    disputed: ["maya:3"],
    title: { maya: "Nashville weekend" },
  };
  const put = await request("/api/prefs", {
    method: "PUT",
    headers: { ...firstHeaders, "content-type": "application/json" },
    body: JSON.stringify(prefs),
  });
  assert.equal(put.response.status, 200);
  assert.deepEqual(put.body, { ok: true });

  const roundTrip = await request("/api/prefs", { headers: firstHeaders });
  assert.equal(roundTrip.response.status, 200);
  assert.deepEqual(roundTrip.body, prefs);

  const second = await login();
  assert.notEqual(first.body.token, second.body.token);
  const isolated = await request("/api/prefs", {
    headers: { authorization: `Bearer ${second.body.token}` },
  });
  assert.deepEqual(isolated.body, {});

  for (const invalidPrefs of [
    {},
    null,
    { ...prefs, types: [] },
    { ...prefs, types: { dining: "yes", domestic: false } },
    { ...prefs, hidden: [1] },
    { ...prefs, title: { constructor: "not allowed" } },
  ]) {
    const invalid = await request("/api/prefs", {
      method: "PUT",
      headers: { ...firstHeaders, "content-type": "application/json" },
      body: JSON.stringify(invalidPrefs),
    });
    assert.equal(invalid.response.status, 400);
  }

  const malformed = await request("/api/prefs", {
    method: "PUT",
    headers: { ...firstHeaders, "content-type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.response.status, 400);
});

test("oversized JSON is rejected with 413 and the server remains usable", async () => {
  const session = await login();
  const headers = {
    authorization: `Bearer ${session.body.token}`,
    "content-type": "application/json",
  };
  const oversized = JSON.stringify({
    types: { dining: false, domestic: false },
    hidden: ["x".repeat(101 * 1024)],
    refunded: [],
    disputed: [],
  });
  const rejected = await request("/api/prefs", { method: "PUT", headers, body: oversized });
  assert.equal(rejected.response.status, 413);
  assert.deepEqual(rejected.body, { error: "payload too large" });

  const stillAvailable = await request("/api/prefs", { headers });
  assert.equal(stillAvailable.response.status, 200);
  assert.deepEqual(stillAvailable.body, {});
});

test("static serving uses a narrow allowlist and blocks path traversal", async () => {
  for (const urlPath of ["/", "/index.html"]) {
    const { status, headers, body } = await rawGet(urlPath);
    assert.equal(status, 200);
    assert.match(headers["content-type"], /^text\/html; charset=utf-8$/);
    assert.equal(headers["x-content-type-options"], "nosniff");
    assert.equal(headers["cache-control"], "no-store");
    assert.match(body, /<html/i);
  }

  for (const urlPath of [
    "/server.js",
    "/data.json",
    "/README.md",
    "/%2e%2e/server.js",
    "/..%2fdata.json",
    "/..%5cserver.js",
    "/css/..%2fserver.js",
    "/js/../server.js",
    "/css/%2e%2e/server.js",
    "/css/..%5cserver.js",
    "/js/..%5cserver.js",
    "/css/..\\server.js",
    "/js/..\\server.js",
    "/css/%00bad.css",
    "/css/.hidden.css",
    "/css/file%2fother.css",
    "/js/file%5cother.js",
  ]) {
    const { status } = await rawGet(urlPath);
    assert.equal(status, 404, `${urlPath} should not be served`);
  }
});

test("static CSS files use the expected content type and headers", async t => {
  if (!staticFixtures.css) {
    t.skip("css directory does not exist");
    return;
  }
  const fileName = path.basename(staticFixtures.css);
  const { status, headers, body } = await rawGet(`/css/${fileName}`);
  assert.equal(status, 200);
  assert.equal(headers["content-type"], "text/css; charset=utf-8");
  assert.equal(headers["cache-control"], "no-cache");
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.equal(Number(headers["content-length"]), Buffer.byteLength(body));
  assert.equal(body, "/* css fixture */\n");

  const head = await request(`/css/${fileName}`, { method: "HEAD" });
  assert.equal(head.response.status, 200);
  assert.equal(head.response.headers.get("content-length"), String(Buffer.byteLength(body)));
  assert.equal(head.body, "");
});

test("static JavaScript files use the expected content type and headers", async t => {
  if (!staticFixtures.js) {
    t.skip("js directory does not exist");
    return;
  }
  const fileName = path.basename(staticFixtures.js);
  const { status, headers, body } = await rawGet(`/js/${fileName}`);
  assert.equal(status, 200);
  assert.equal(headers["content-type"], "text/javascript; charset=utf-8");
  assert.equal(headers["cache-control"], "no-cache");
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.equal(Number(headers["content-length"]), Buffer.byteLength(body));
  assert.equal(body, "// js fixture\n");
});

test("static image files and invalid static paths return the expected responses", async t => {
  if (staticFixtures.png) {
    const { status, headers } = await rawGet(`/docs/${path.basename(staticFixtures.png)}`);
    assert.equal(status, 200);
    assert.equal(headers["content-type"], "image/png");
    assert.equal(headers["cache-control"], "no-cache");
  } else {
    t.diagnostic("docs directory does not exist; skipping the PNG fixture check");
  }

  for (const urlPath of ["/css/nested/file.css", "/js/nested/file.js", "/docs/nested/image.png"]) {
    const { status, body } = await rawGet(urlPath);
    assert.equal(status, 404, `${urlPath} should reject nested paths`);
    assert.deepEqual(JSON.parse(body), { error: "not found" });
  }
  if (staticFixtures.css) {
    const nestedTraversal = await rawGet(`/css/subdir/../${path.basename(staticFixtures.css)}`);
    assert.equal(nestedTraversal.status, 404);
  }

  const wrongMethod = await request(staticFixtures.css ? `/css/${path.basename(staticFixtures.css)}` : "/css/missing.css", {
    method: "POST",
  });
  assert.equal(wrongMethod.response.status, 405);
  assert.equal(wrongMethod.response.headers.get("allow"), "GET, HEAD");
  assert.deepEqual(wrongMethod.body, { error: "method not allowed" });

  const missing = await rawGet("/css/not-present.css");
  assert.equal(missing.status, 404);
  assert.deepEqual(JSON.parse(missing.body), { error: "not found" });
});

test("known API routes reject unsupported methods and do not enable CORS", async () => {
  const method = await request("/api/login", { method: "GET" });
  assert.equal(method.response.status, 405);
  assert.equal(method.response.headers.get("allow"), "POST");
  assert.equal(method.response.headers.get("access-control-allow-origin"), null);

  const unknownRoute = await request("/api/not-a-route");
  assert.equal(unknownRoute.response.status, 404);
});

test("JSON write endpoints require a JSON content type", async () => {
  const session = await login();
  const result = await request("/api/prefs", {
    method: "PUT",
    headers: {
      authorization: `Bearer ${session.body.token}`,
      "content-type": "text/plain",
    },
    body: "{}",
  });
  assert.equal(result.response.status, 415);
  assert.deepEqual(result.body, { error: "content type must be application/json" });
});

test("recap names are stored per trip (persona:date) and per persona, and nothing else", async () => {
  const { body: { token } } = await login();
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const base = { types: { dining: true, domestic: true }, hidden: [], refunded: [], disputed: [] };
  const put = (title) => request("/api/prefs", { method: "PUT", headers, body: JSON.stringify({ ...base, title }) });

  for (const good of [{ maya: "Weekend" }, { "jordan:2026-10-23": "Seattle" }, { maya: "A", "jordan:2026-08-14": "Denver", "jordan:2026-09-18": "Austin" }]) {
    assert.equal((await put(good)).response.status, 200, JSON.stringify(good));
  }
  const stored = await request("/api/prefs", { headers });
  assert.equal(stored.body.title["jordan:2026-09-18"], "Austin");

  for (const bad of [{ "nobody:2026-10-23": "x" }, { "jordan:20261023": "x" }, { "jordan:2026-13-40": "x" }, { "jordan:2026-00-10": "x" }, { "jordan:bad": "x" }, { "jordan:../x": "x" }, { "JORDAN": "x" }, { "jordan:2026-10-23:x": "x" }, { "jordan:2026-10-23": 5 }]) {
    assert.equal((await put(bad)).response.status, 400, JSON.stringify(bad));
  }
});
