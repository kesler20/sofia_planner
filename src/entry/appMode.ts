// Public navigation preference never authorizes backend requests.
export const personalPreferenceKey = "sofia/preferred-mode";
export function entryUrl(mode: "personal" | "demo" | "landing"): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.searchParams.set("mode", mode);
  return url.href;
}
export function initialMode(): "personal" | "demo" | "landing" {
  const query = new URLSearchParams(window.location.search);
  if (query.has("code") || query.has("state") || query.has("error")) return "personal";
  const explicit = query.get("mode");
  if (explicit === "demo" || explicit === "personal" || explicit === "landing") return explicit;
  try { if (localStorage.getItem(personalPreferenceKey) === "personal") return "personal"; }
  catch { /* Storage is optional. Direct links still select a mode. */ }
  return "landing";
}
export function rememberPersonal(): void {
  try { localStorage.setItem(personalPreferenceKey, "personal"); }
  catch { /* Sign-in remains usable when browser storage is unavailable. */ }
}
