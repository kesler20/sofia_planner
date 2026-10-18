import * as assert from "node:assert/strict";
import * as crypto from "node:crypto";
import * as http from "node:http";
import { after, before, beforeEach, test } from "node:test";
import { createApp } from "../src/app";
import { AccountAuthConfiguration, loadAccountAuthConfiguration, validateAccountAuthConfiguration } from "../src/infrastructure/auth/accountAuth";
import { NoSQLDbInterface } from "../src/infrastructure/db/no_sql/noSQLDBInterface";

// Only generated keys, loopback JWKS, synthetic accounts and in-memory resources.
// This exercises the production middleware without a Redis or Auth0 connection.
class MemoryStorage implements NoSQLDbInterface {
  values = new Map<string, Record<string, unknown>>();
  calls = 0;
  fail = false;
  corrupt = false;
  check() {
    this.calls++;
    if (this.corrupt) throw new SyntaxError("PRIVATE_STORED_JSON");
    if (this.fail) throw new Error("PRIVATE_PROVIDER_DETAIL");
  }
  async putResource(topic: string, resource: string, value: Record<string, unknown>) {
    this.check(); this.values.set(`${topic}:${resource}`, value); return true;
  }
  async getResource(topic: string, resource: string) {
    this.check(); return this.values.get(`${topic}:${resource}`) ?? null;
  }
  async getResources(topic: string) {
    this.check(); return [...this.values].filter(([key]) => key.startsWith(`${topic}:`)).map(([, value]) => value);
  }
  async deleteResource(topic: string, resource: string) {
    this.check(); this.values.delete(`${topic}:${resource}`); return true;
  }
  async compareAndSwapResource(topic: string, resource: string, expected: Record<string, unknown> | null, replacement: Record<string, unknown>) {
    this.check(); const key = `${topic}:${resource}`;
    try { assert.deepStrictEqual(this.values.get(key) ?? null, expected); } catch { return false; }
    this.values.set(key, replacement); return true;
  }
  close() {}
}

const storage = new MemoryStorage();
const keys = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const foreignKeys = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
const issuer = "https://synthetic-tenant.example/";
const audience = "https://synthetic-api.example";
let jwksServer: http.Server;
let apiServer: http.Server;
let base: string;
let configuration: AccountAuthConfiguration;

function token(subject = "auth0|alice", overrides: Record<string, unknown> = {}, foreign = false): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "synthetic-key" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: issuer, aud: audience, sub: subject,
    email: "same-mailbox@example.test", email_verified: true,
    exp: Math.floor(Date.now() / 1000) + 300, ...overrides })).toString("base64url");
  const input = `${header}.${payload}`;
  return `${input}.${crypto.sign("RSA-SHA256", Buffer.from(input), foreign ? foreignKeys.privateKey : keys.privateKey).toString("base64url")}`;
}

function listen(server: http.Server): Promise<string> {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No loopback listener");
    resolve(`http://127.0.0.1:${address.port}`);
  }));
}

async function request(path: string, bearer: string | null = token(), method = "GET", body?: unknown) {
  return fetch(`${base}${path}`, { method, headers: {
    ...(bearer === null ? {} : { Authorization: `Bearer ${bearer}` }),
    ...(body === undefined ? {} : { "Content-Type": "application/json" }),
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}

before(async () => {
  const publicJwk = keys.publicKey.export({ format: "jwk" });
  jwksServer = http.createServer((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ keys: [{ ...publicJwk, use: "sig", alg: "RS256", kid: "synthetic-key" }] }));
  });
  const jwksBase = await listen(jwksServer);
  configuration = { issuer, audience, ownerSubject: "auth0|alice", ownerAccountTopic: "legacy-owner@example.test",
    allowedOrigins: ["http://localhost:5173"], jwksUri: `${jwksBase}/jwks` };
  apiServer = http.createServer(createApp({ storage, authConfiguration: configuration }));
  base = await listen(apiServer);
});
beforeEach(() => { storage.values.clear(); storage.calls = 0; storage.fail = false; storage.corrupt = false; });
after(async () => {
  for (const server of [apiServer, jwksServer]) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("all account and CRUD routes reject anonymous reads and writes before storage", async () => {
  for (const [path, method, body] of [
    ["/v1/account", "GET"], ["/resources/me", "GET"], ["/resources/me/budget", "GET"],
    ["/resources/me", "POST", { resourceName: "budget", resourceContent: "{}" }],
    ["/resources/me/budget", "PUT", { content: "{}" }], ["/resources/me/budget", "DELETE"],
    ["/v1/resources/me/budget", "PUT", { expected: null, replacement: {} }],
  ] as const) {
    assert.equal((await request(path, null, method, body)).status, 401);
  }
  assert.equal(storage.calls, 0);
});

test("forged, expired, wrong issuer/audience, missing subject and missing expiry tokens fail", async () => {
  const invalid = ["not-a-jwt", token("auth0|alice", {}, true),
    token("auth0|alice", { exp: Math.floor(Date.now() / 1000) - 60 }),
    token("auth0|alice", { iss: "https://other-issuer.example/" }),
    token("auth0|alice", { aud: "wrong-api" }), token("", {}),
    token("auth0|alice", { sub: undefined }), token("auth0|alice", { exp: undefined }),
    token("auth0|alice", { nbf: Math.floor(Date.now() / 1000) + 60 }),
  ];
  for (const bearer of invalid) {
    const response = await request("/resources/me/budget", bearer);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Authentication required" });
  }
  assert.equal(storage.calls, 0);
});

test("HS256 algorithm substitution is rejected", async () => {
  const [oldHeader, payload] = token().split(".");
  assert.ok(oldHeader);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", kid: "synthetic-key" })).toString("base64url");
  const data = `${header}.${payload}`;
  const signed = crypto.createHmac("sha256", "synthetic-only-secret").update(data).digest("base64url");
  assert.equal((await request("/v1/account", `${data}.${signed}`)).status, 401);
  assert.equal(storage.calls, 0);
});

test("only the configured owner can access personal resources", async () => {
  const owner = await request("/v1/account");
  assert.equal(owner.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await owner.json(), { topic: "legacy-owner@example.test" });
  for (const subject of ["google-oauth2|bob", "auth0|same-email-other-provider"]) {
    const before = storage.calls;
    assert.equal((await request("/v1/account", token(subject))).status, 403);
    assert.equal((await request("/resources/me/budget", token(subject))).status, 403);
    assert.equal(storage.calls, before);
  }
});

test("each CRUD route and CAS reject another account topic and Redis glob prefixes", async () => {
  const bob = token("google-oauth2|bob");
  for (const topic of ["legacy-owner@example.test", "%2A", "%3F", "legacy-owner@example.test%3Aextra", "subject_fake"]) {
    const callsBefore = storage.calls;
    for (const [suffix, method, body] of [
      ["", "GET"], ["/budget", "GET"], ["", "POST", { resourceName: "budget", resourceContent: "{}" }],
      ["/budget", "PUT", { content: "{}" }], ["/budget", "DELETE"],
    ] as const) assert.equal((await request(`/resources/${topic}${suffix}`, bob, method, body)).status, 403);
    assert.equal((await request(`/v1/resources/${topic}/budget`, bob, "PUT", { expected: null, replacement: {} })).status, 403);
    assert.equal(storage.calls, callsBefore);
  }
});

test("the same authenticated account can use its exact legacy path", async () => {
  assert.equal((await request("/resources/legacy-owner@example.test", token(), "POST", { resourceName: "budget", resourceContent: '{"value":1}' })).status, 201);
  assert.deepEqual(await (await request("/resources/legacy-owner@example.test/budget")).json(), { value: 1 });
});

test("own CRUD, listing and conditional conflicts operate within the resolved account", async () => {
  assert.equal((await request("/resources/me", token(), "POST", { resourceName: "budget", resourceContent: '{"value":1}' })).status, 201);
  assert.deepEqual(await (await request("/resources/me")).json(), [{ value: 1 }]);
  assert.equal((await request("/resources/me/budget", token(), "PUT", { content: '{"value":2}' })).status, 200);
  const casPath = "/v1/resources/me/budget";
  assert.equal((await request(casPath, token(), "PUT", { expected: { value: 1 }, replacement: { value: 3 } })).status, 409);
  assert.equal((await request(casPath, token(), "PUT", { expected: { value: 2 }, replacement: { value: 3 } })).status, 200);
  assert.deepEqual(await (await request("/resources/me/budget")).json(), { value: 3 });
  assert.equal((await request("/resources/me/budget", token(), "DELETE")).status, 200);
  assert.equal((await request("/resources/me/budget")).status, 404);
  assert.equal((await request(casPath, token(), "PUT", { expected: null, replacement: { value: 4 } })).status, 200);
});

test("resource delimiters and globs are rejected on all resource routes", async () => {
  for (const resourceName of ["other:budget", "*", "[ab]", "a/b", "bad\\key"]) {
    const callsBefore = storage.calls;
    assert.equal((await request("/resources/me", token(), "POST", { resourceName, resourceContent: "{}" })).status, 400);
    for (const method of ["GET", "PUT", "DELETE"]) {
      assert.equal((await request(`/resources/me/${encodeURIComponent(resourceName)}`, token(), method, method === "PUT" ? { content: "{}" } : undefined)).status, 400);
    }
    assert.equal((await request(`/v1/resources/me/${encodeURIComponent(resourceName)}`, token(), "PUT", { expected: null, replacement: {} })).status, 400);
    assert.equal(storage.calls, callsBefore);
  }
});

test("malformed requests and provider failures do not expose private contents", async () => {
  const messages: unknown[][] = [];
  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...values: unknown[]) => { messages.push(values); };
  console.log = (...values: unknown[]) => { messages.push(values); };
  try {
  const bad = await request("/resources/me", token(), "POST", { resourceName: "budget", resourceContent: "PRIVATE_MALFORMED_PAYLOAD" });
  assert.equal(bad.status, 400);
  assert.deepEqual(await bad.json(), { error: "Invalid resource request" });
  storage.fail = true;
  const failed = await request("/resources/me/budget");
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: "Resource request failed" });
  assert.deepEqual(messages, [["Resource request failed"]]);
  } finally { console.error = originalError; console.log = originalLog; }
});

test("authentication startup fails closed and rejects unsafe namespace bindings", () => {
  assert.throws(() => loadAccountAuthConfiguration({}));
  assert.throws(() => validateAccountAuthConfiguration({ ...configuration, ownerSubject: "" }));
  assert.throws(() => validateAccountAuthConfiguration({ ...configuration, ownerAccountTopic: "" }));
  assert.throws(() => loadAccountAuthConfiguration({ AUTH0_ISSUER_BASE_URL: issuer }));
  for (const topic of ["*", "a:b", "me", "a/b"]) {
    assert.throws(() => validateAccountAuthConfiguration({ ...configuration, ownerAccountTopic: topic }));
  }
  assert.throws(() => validateAccountAuthConfiguration({ ...configuration, issuer: "http://tenant.example/" }));
  assert.throws(() => validateAccountAuthConfiguration({ ...configuration, allowedOrigins: ["*"] }));
});

test("stored JSON corruption is a private server error rather than a malformed request", async () => {
  storage.corrupt = true;
  const originalError = console.error;
  const messages: unknown[][] = [];
  console.error = (...values: unknown[]) => { messages.push(values); };
  try {
    for (const path of ["/resources/me/budget", "/resources/me"]) {
      const response = await request(path);
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { error: "Resource request failed" });
    }
    assert.deepEqual(messages, [["Resource request failed"], ["Resource request failed"]]);
  } finally { console.error = originalError; }
});

test("reserved storage marker cannot be supplied as public resource content", async () => {
  const reserved = { __headless_empty_resource__: 1 };
  assert.equal((await request("/resources/me", token(), "POST", { resourceName: "budget", resourceContent: JSON.stringify(reserved) })).status, 400);
  assert.equal((await request("/v1/resources/me/budget", token(), "PUT", { expected: null, replacement: reserved })).status, 400);
  assert.equal((await request("/v1/resources/me/budget", token(), "PUT", { expected: reserved, replacement: {} })).status, 400);
  assert.equal(storage.calls, 0);
});
