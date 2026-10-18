import * as assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { createClient } from "redis";
import RedisDBAdapter from "../src/infrastructure/db/no_sql/redisNoSQLDbAdapter";
import { emptyResourceField } from "../src/infrastructure/db/no_sql/resourceStorageFormat";

// The fixture owns a dedicated loopback server. No application config is loaded.
const port = Number(process.env.SOFIA_TEST_REDIS_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Isolated test server port is required");
const client = createClient({ socket: { host: "127.0.0.1", port, connectTimeout: 1000, reconnectStrategy: false } });
const adapter = new RedisDBAdapter(client);
const topic = "synthetic_" + crypto.randomUUID();
const key = `${topic}:resource`;
before(async () => { await client.connect(); });
beforeEach(async () => {
  const keys = await client.keys(`${topic}:*`);
  if (keys.length) await client.del(keys);
});
after(async () => { await client.disconnect(); });

test("missing, empty and populated resources remain distinct through real adapter and Lua", async () => {
  assert.equal(await adapter.getResource(topic, "resource"), null);
  assert.equal(await adapter.compareAndSwapResource(topic, "resource", {}, { value: 1 }), false);
  assert.equal(await client.exists(key), 0);
  assert.equal(await adapter.compareAndSwapResource(topic, "resource", null, {}), true);
  assert.equal(await client.exists(key), 1);
  assert.deepEqual({ ...await client.hGetAll(key) }, { [emptyResourceField]: "1" });
  assert.deepEqual(await adapter.getResource(topic, "resource"), {});
  assert.deepEqual(await adapter.getResources(topic), [{}]);
  assert.equal(await adapter.compareAndSwapResource(topic, "resource", null, { value: 1 }), false);
  assert.equal(await adapter.compareAndSwapResource(topic, "resource", {}, { value: 1 }), true);
  assert.deepEqual(await adapter.getResource(topic, "resource"), { value: 1 });
  assert.equal(await adapter.compareAndSwapResource(topic, "resource", { value: 1 }, {}), true);
  assert.deepEqual(await adapter.getResource(topic, "resource"), {});
  await adapter.deleteResource(topic, "resource");
  assert.equal(await adapter.getResource(topic, "resource"), null);
});

test("unconditional writes replace empty and populated resources without marker leakage", async () => {
  await adapter.putResource(topic, "resource", {});
  assert.deepEqual(await adapter.getResource(topic, "resource"), {});
  await adapter.putResource(topic, "resource", { value: 1 });
  assert.deepEqual({ ...await client.hGetAll(key) }, { value: "1" });
  await adapter.putResource(topic, "resource", {});
  assert.deepEqual(await adapter.getResources(topic), [{}]);
  assert.equal(await client.hLen(key), 1);
});

test("legacy hashes and object ordering remain compatible and stale writes conflict", async () => {
  const original = { schema_version: 1, nested: { a: 1, b: 2 }, entries: [1, 2] };
  await client.hSet(key, { schema_version: "1", nested: '{"b":2,"a":1}', entries: "[1,2]" });
  assert.deepEqual(await adapter.getResource(topic, "resource"), original);
  const outcomes = await Promise.all([
    adapter.compareAndSwapResource(topic, "resource", original, { value: 1 }),
    adapter.compareAndSwapResource(topic, "resource", original, { value: 2 }),
  ]);
  assert.deepEqual(outcomes.sort(), [false, true]);
  assert.equal(await adapter.compareAndSwapResource(topic, "resource", original, {}), false);
});

test("stored JSON or marker corruption propagates and reserved content is rejected", async () => {
  await client.hSet(key, { value: "PRIVATE_INVALID_JSON" });
  await assert.rejects(adapter.getResource(topic, "resource"), SyntaxError);
  await assert.rejects(adapter.getResources(topic), SyntaxError);
  await client.del(key);
  await client.hSet(key, { [emptyResourceField]: "false" });
  await assert.rejects(adapter.getResource(topic, "resource"), /Invalid empty resource storage/);
  await assert.rejects(adapter.compareAndSwapResource(topic, "resource", {}, { value: 1 }));
  await assert.rejects(adapter.putResource(topic, "resource", { [emptyResourceField]: 1 }), /Reserved resource field/);
  await assert.rejects(adapter.compareAndSwapResource(topic, "resource", {}, { [emptyResourceField]: 1 }), /Reserved resource field/);
});
