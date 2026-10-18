export const authConfig = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "dev-vdgok26xngs8bggz.us.auth0.com",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "ZtjhKuSTQoES0aFfXgao9m6NhcDjQrxJ",
  audience: import.meta.env.VITE_AUTH0_AUDIENCE as string | undefined,
};

export function authRedirectUri(): string {
  // Only the deployed application base participates in OAuth callbacks, never route/query input.
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/diet/monitoring";
  return value;
}
