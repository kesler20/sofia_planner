import axios, { AxiosError, type AxiosAdapter } from "axios";
import { resources } from "./demoFixtures";
import { activateResourceSession } from "../auth/resourceSession";

// Demo requests have their own local transport. They never fall through to HTTP.
const storageKey = "sofia/demo/resources/v1";
export const demoAccount = "synthetic-demo";
let fallback: Record<string, unknown> = structuredClone(resources);
function read(): Record<string, unknown> {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : fallback;
}
function write(value: Record<string, unknown>): void {
  localStorage.setItem(storageKey, JSON.stringify(value));
  fallback = value;
}
export function resetDemo(): void { localStorage.removeItem(storageKey); }
export function installDemoStorage(): void {
  activateResourceSession({ account: demoAccount, mode: "demo" });
  const adapter: AxiosAdapter = async config => {
    const url = new URL(config.url ?? "", window.location.origin);
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    const index = parts.indexOf("resources");
    const name = parts[index + 2];
    const method = config.method ?? "get";
    const data = read();
    const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    const respond = (value: unknown, status = 200) => ({ data: value, status, statusText: "Demo", headers: {}, config });
    const fail = (status: number): never => { throw new AxiosError("Demo request failed", "ERR_BAD_REQUEST", config, undefined, respond(null, status)); };
    if (index < 0 || parts[index + 1] !== demoAccount) return fail(403);
    if (method === "get") {
      if (!name) return respond(Object.values(data));
      if (!(name in data)) return fail(404);
      return respond(Array.isArray(data[name]) ? { key: data[name] } : data[name]);
    }
    if (method === "post" && !name) {
      data[body.resourceName] = JSON.parse(body.resourceContent); write(data); return respond({ created: true }, 201);
    }
    if (method === "put" && parts[0] === "v1") {
      // Compare complete resources before replacing, mirroring the personal save contract.
      const normalize = (value: unknown) => Array.isArray(value) ? { key: value } : value;
      if (JSON.stringify(normalize(data[name] ?? null)) !== JSON.stringify(body.expected)) return fail(409);
      data[name] = body.replacement; write(data); return respond({ applied: true });
    }
    if (method === "delete" && name) { delete data[name]; write(data); return respond({ deleted: true }); }
    return fail(400);
  };
  axios.defaults.adapter = adapter;
}
