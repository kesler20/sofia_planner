import axios from "axios";
import { readResourceInDb, createResourceInDb, readResourceSnapshot } from "../../utils";
import { analyticsSchema, configSchema, emptyConfig } from "./healthTypes";
import type { HealthConfig, HealthData, Period } from "./healthTypes";

export async function loadHealthData(user: string): Promise<HealthData> {
  const results = await Promise.allSettled([
    readResourceInDb<string>(user, "health_analytics").then(({ result, error }) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      if (error || result === undefined) {
        console.log("Error loading health_analytics", error);
        throw new Error("Unable to load Health observations");
      }
      return analyticsSchema.parse(typeof result === "string" ? JSON.parse(result) : result);
    }),
    readResourceInDb<string>(user, "health_config").then(({ result, error }) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return emptyConfig();
      if (error || result === undefined) {
        console.log("Error loading health_config", error);
        throw new Error("Unable to load Health configuration");
      }
      return configSchema.parse(typeof result === "string" ? JSON.parse(result) : result);
    }),
  ]);
  return {
    analytics: results[0].status === "fulfilled" ? results[0].value : null,
    config: results[1].status === "fulfilled" ? results[1].value : null,
    failedResources: results.flatMap((result, index) => result.status === "rejected" ? [index === 0 ? "health_analytics" : "health_config"] : []),
    errors: results.flatMap(result => result.status === "rejected" ? [String(result.reason)] : []),
  };
}

export async function saveHealthConfig(user: string, config: HealthConfig): Promise<void> {
  const validated = configSchema.parse(config);
  const { result, error } = await createResourceInDb(user, "health_config", JSON.stringify(validated));
  if (error || result === false) {
    console.log("Error saving health_config", error ?? "Backend reported an unsuccessful write");
    throw new Error("Unable to save Health configuration");
  }
}

export async function saveHealthSelection(user: string, group: "targets" | "limits", id: string, period: Period, value: number | { lower: number; upper: number } | undefined): Promise<HealthConfig> {
  const raw = await readResourceSnapshot(user, "health_config");
  const config = raw ? configSchema.parse(raw) : emptyConfig();
  const next = configSchema.parse({ ...config, [group]: { ...config[group], [id]: { ...config[group][id], [period]: value } } });
  await saveHealthConfig(user, next);
  const saved = configSchema.parse(await readResourceSnapshot(user, "health_config"));
  if (JSON.stringify(saved[group][id]?.[period]) !== JSON.stringify(next[group][id]?.[period])) throw new Error("Saved setting could not be verified. Reload before trying again.");
  window.dispatchEvent(new Event("sofia-health-config-saved"));
  return saved;
}

export function retainSuccessfulData(previous: HealthData | null, next: HealthData): HealthData {
  return { ...next, analytics: next.failedResources?.includes("health_analytics") ? previous?.analytics ?? null : next.analytics, config: next.failedResources?.includes("health_config") ? previous?.config ?? null : next.config };
}

export function observeHealthData(user: string, onEventLoaded: (data: HealthData) => void): () => void {
  let active = true;
  let pending = false;
  let revision = 0;
  const refresh = async () => {
    if (pending || document.visibilityState === "hidden") return;
    pending = true;
    const requestRevision = revision;
    try {
      const data = await loadHealthData(user);
      if (active && requestRevision === revision) onEventLoaded(data);
    } finally {
      pending = false;
      if (active && requestRevision !== revision) void refresh();
    }
  };
  const handleSaved = () => { revision += 1; void refresh(); };
  void refresh();
  const timer = window.setInterval(refresh, 60000);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("sofia-health-config-saved", handleSaved);
  return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("sofia-health-config-saved", handleSaved); };
}
