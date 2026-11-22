"use strict";

// Fake-data backend for the concept prototype. Run with `npm start` and log in
// with demo / demo. By default it listens only on localhost.
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const MAX_BODY = 100 * 1024;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_SESSIONS = 500;
const STATIC_FILES = Object.freeze({
  "/": { file: "index.html", contentType: "text/html; charset=utf-8", cacheControl: "no-store" },
  "/index.html": { file: "index.html", contentType: "text/html; charset=utf-8", cacheControl: "no-store" },
});
const STATIC_DIRECTORIES = Object.freeze({
  css: { directory: "css", extension: ".css", contentType: "text/css; charset=utf-8" },
  js: { directory: "js", extension: ".js", contentType: "text/javascript; charset=utf-8" },
  docs: { directory: "docs", extension: ".png", contentType: "image/png" },
});

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isJsonContentType(value) {
  return typeof value === "string" && value.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

function readJsonBody(req) {
  if (!isJsonContentType(req.headers["content-type"])) {
    req.resume();
    return Promise.reject(new HttpError(415, "content type must be application/json"));
  }

  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    let settled = false;
    const chunks = [];
    const fail = error => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on("data", chunk => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > MAX_BODY) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });

    req.once("aborted", () => fail(new HttpError(400, "request aborted")));
    req.once("error", fail);
    req.once("end", () => {
      if (settled) return;
      settled = true;
      if (tooLarge) {
        reject(new HttpError(413, "payload too large"));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new HttpError(400, "invalid JSON"));
      }
    });
  });
}

function validPrefs(value) {
  if (!isPlainObject(value)) return false;

  const required = ["types", "hidden", "refunded", "disputed"];
  const allowed = new Set([...required, "title"]);
  if (Object.keys(value).some(key => !allowed.has(key))) return false;
  if (required.some(key => !Object.hasOwn(value, key))) return false;

  const { types, hidden, refunded, disputed } = value;
  if (!isPlainObject(types) || Object.keys(types).length !== 2 ||
      !Object.hasOwn(types, "dining") || !Object.hasOwn(types, "domestic") ||
      typeof types.dining !== "boolean" || typeof types.domestic !== "boolean") return false;

  for (const list of [hidden, refunded, disputed]) {
    if (!Array.isArray(list) || list.length > 1000 ||
        list.some(item => typeof item !== "string" || item.length > 256)) return false;
  }

  if (Object.hasOwn(value, "title")) {
    // keys are "persona" or "persona:YYYY-MM-DD" (one recap name per trip)
    if (!isPlainObject(value.title) || Object.keys(value.title).length > 200) return false;
    for (const [key, title] of Object.entries(value.title)) {
      const parts = /^([a-z]+)(?::\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))?$/.exec(key);
      if (!parts || !Object.hasOwn(DATA, parts[1]) || typeof title !== "string" || title.length > 200) return false;
    }
  }
  return true;
}

function sendJson(res, status, value, extraHeaders = {}) {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    ...extraHeaders,
  });
  res.end(JSON.stringify(value));
}

function resolveStaticFile(directoryName, fileName) {
  const directory = path.resolve(__dirname, directoryName);
  const filePath = path.resolve(directory, fileName);
  if (!filePath.startsWith(`${directory}${path.sep}`)) return null;
  return filePath;
}

async function serveStaticFile(req, res, filePath, contentType, cacheControl) {
  let contents;
  try {
    contents = await fs.promises.readFile(filePath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendJson(res, 404, { error: "not found" });
    } else {
      sendJson(res, 500, { error: "server error" });
    }
    return;
  }

  if (res.destroyed || res.writableEnded) return;
  res.writeHead(200, {
    "content-type": contentType,
    "cache-control": cacheControl,
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "content-length": contents.length,
  });
  res.end(req.method === "HEAD" ? undefined : contents);
}

function secureEqual(actual, expected) {
  if (typeof actual !== "string") return false;
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && crypto.timingSafeEqual(actualBytes, expectedBytes);
}

function createServer() {
  // Each server instance owns its sessions, which keeps test instances isolated.
  const sessions = new Map();

  function pruneSessions(now = Date.now()) {
    for (const [token, session] of sessions) {
      if (now - session.lastUsed > SESSION_TTL_MS) sessions.delete(token);
    }
  }

  function getSession(req) {
    const authorization = req.headers.authorization;
    const match = typeof authorization === "string" && /^Bearer ([A-Za-z0-9_-]{43})$/.exec(authorization);
    if (!match) return null;

    const token = match[1];
    const session = sessions.get(token);
    if (!session) return null;
    const now = Date.now();
    if (now - session.lastUsed > SESSION_TTL_MS) {
      sessions.delete(token);
      return null;
    }
    session.lastUsed = now;
    return session;
  }

  async function handle(req, res) {
    // Accept origin-form paths only; the UI and API are same-origin, with no CORS access.
    if (typeof req.url !== "string" || !req.url.startsWith("/") || req.url.startsWith("//")) {
      throw new HttpError(400, "invalid request URL");
    }

    let url;
    try {
      url = new URL(req.url, "http://localhost");
    } catch {
      throw new HttpError(400, "invalid request URL");
    }

    const pathname = url.pathname;
    const rawPathname = req.url.split(/[?#]/, 1)[0];
    const apiRoutes = {
      "/api/login": ["POST"],
      "/api/transactions": ["GET"],
      "/api/prefs": ["GET", "PUT", "DELETE"],
    };
    if (Object.hasOwn(apiRoutes, pathname)) {
      const methods = apiRoutes[pathname];
      if (!methods.includes(req.method)) {
        sendJson(res, 405, { error: "method not allowed" }, { allow: methods.join(", ") });
        return;
      }

      if (pathname === "/api/login") {
        const credentials = await readJsonBody(req);
        const correct = isPlainObject(credentials) &&
          secureEqual(credentials.user, "demo") && secureEqual(credentials.pass, "demo");
        if (!correct) {
          sendJson(res, 401, { error: "bad credentials" });
          return;
        }

        pruneSessions();
        if (sessions.size >= MAX_SESSIONS) {
          sendJson(res, 503, { error: "too many active sessions" });
          return;
        }
        const token = crypto.randomBytes(32).toString("base64url");
        sessions.set(token, { prefs: {}, lastUsed: Date.now() });
        sendJson(res, 200, { token });
        return;
      }

      const session = getSession(req);
      if (!session) {
        sendJson(res, 401, { error: "unauthorized" });
        return;
      }

      if (pathname === "/api/transactions") {
        const persona = url.searchParams.get("persona") || "";
        if (!Object.hasOwn(DATA, persona)) {
          sendJson(res, 404, { error: "no persona" });
          return;
        }
        sendJson(res, 200, { tx: DATA[persona].tx });
        return;
      }

      if (req.method === "GET") {
        sendJson(res, 200, session.prefs);
        return;
      }
      if (req.method === "DELETE") {
        session.prefs = {};
        sendJson(res, 200, { ok: true });
        return;
      }
      const prefs = await readJsonBody(req);
      if (!validPrefs(prefs)) {
        sendJson(res, 400, { error: "invalid prefs" });
        return;
      }
      session.prefs = prefs;
      sendJson(res, 200, { ok: true });
      return;
    }

    const staticRoute = Object.hasOwn(STATIC_FILES, rawPathname);
    const staticDirectoryMatch = /^\/(css|js|docs)(?:\/|$)/.exec(rawPathname);
    if (staticRoute || staticDirectoryMatch) {
      if (req.method !== "GET" && req.method !== "HEAD") {
        sendJson(res, 405, { error: "method not allowed" }, { allow: "GET, HEAD" });
        return;
      }
      if (staticRoute) {
        const file = STATIC_FILES[rawPathname];
        const filePath = resolveStaticFile(".", file.file);
        await serveStaticFile(req, res, filePath, file.contentType, file.cacheControl);
        return;
      }

      const [, directoryKey] = staticDirectoryMatch;
      const route = STATIC_DIRECTORIES[directoryKey];
      const prefix = `/${directoryKey}/`;
      const fileName = rawPathname.startsWith(prefix) ? rawPathname.slice(prefix.length) : "";
      const validFileName = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(fileName) &&
        fileName.endsWith(route.extension);
      if (!validFileName) {
        sendJson(res, 404, { error: "not found" });
        return;
      }

      const filePath = resolveStaticFile(route.directory, fileName);
      if (!filePath) {
        sendJson(res, 404, { error: "not found" });
        return;
      }
      await serveStaticFile(req, res, filePath, route.contentType, "no-cache");
      return;
    }

    sendJson(res, 404, { error: "not found" });
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch(error => {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message });
        return;
      }
      console.error("Request failed:", error);
      sendJson(res, 500, { error: "server error" });
    });
  });

  server.headersTimeout = 10_000;
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 100;
  return server;
}

function startServer() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "127.0.0.1";
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer from 0 to 65535");
  }

  const server = createServer();
  server.on("error", error => {
    console.error("Server error:", error);
    process.exitCode = 1;
  });
  server.listen(port, host, () => {
    const displayHost = host === "0.0.0.0" ? "localhost" : host;
    console.log(`Mock backend on http://${displayHost}:${server.address().port} (login demo / demo)`);
  });

  let shuttingDown = false;
  const shutdown = signal => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; closing server`);
    server.close(error => {
      if (error) {
        console.error("Error while closing server:", error);
        process.exitCode = 1;
      }
    });
    server.closeIdleConnections?.();
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  return server;
}

if (require.main === module) startServer();

module.exports = { createServer };
