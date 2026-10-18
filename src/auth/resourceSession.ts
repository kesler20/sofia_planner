// Resource authorization belongs to the active authenticated account, never localStorage.
type ResourceSession = { account: string; getToken: () => Promise<string>; mode?: "personal" } | { account: string; mode: "demo" };
let activeSession: ResourceSession | null = null;

export function activateResourceSession(session: ResourceSession): () => void {
  activeSession = session;
  return () => { if (activeSession === session) activeSession = null; };
}

export async function resourceHeaders(account: string): Promise<Record<string, string>> {
  const session = activeSession;
  if (!session || session.account !== account) throw new Error("Account session is unavailable");
  if (session.mode === "demo") return {};
  const token = await session.getToken();
  // An account change while token acquisition was pending must cancel the old request.
  if (activeSession !== session) throw new Error("Account session changed");
  return { Authorization: `Bearer ${token}` };
}
