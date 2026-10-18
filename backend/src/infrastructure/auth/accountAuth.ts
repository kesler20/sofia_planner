import * as express from "express";
import { auth } from "express-oauth2-jwt-bearer";
import * as z from "zod";

const topicSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._@+-]{0,253}$/);
export const resourceNameSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/);
const subjectSchema = z.string().min(1).max(512).refine((value) => value.trim() === value);

export type AccountAuthConfiguration = {
  issuer: string;
  audience: string;
  ownerSubject: string;
  ownerAccountTopic: string;
  allowedOrigins: string[];
  // Constructor-only override permits local JWKS fixtures without a live tenant.
  jwksUri?: string;
};

export function validateAccountAuthConfiguration(configuration: AccountAuthConfiguration): void {
  const issuer = new URL(configuration.issuer);
  if (issuer.protocol !== "https:" || issuer.username || issuer.password || issuer.search || issuer.hash || !configuration.issuer.endsWith("/")) {
    throw new Error("AUTH0_ISSUER_BASE_URL must be an HTTPS issuer ending in a slash");
  }
  if (!configuration.audience || configuration.audience.trim() !== configuration.audience) {
    throw new Error("AUTH0_AUDIENCE must match the registered API identifier");
  }
  subjectSchema.parse(configuration.ownerSubject);
  topicSchema.parse(configuration.ownerAccountTopic);
  if (configuration.ownerAccountTopic === "me") throw new Error("Reserved account namespace");
  for (const origin of configuration.allowedOrigins) {
    const url = new URL(origin);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) throw new Error("Invalid CORS origin");
  }
  if (!configuration.allowedOrigins.length) throw new Error("CORS_ALLOWED_ORIGINS is required");
}

export function loadAccountAuthConfiguration(environment: NodeJS.ProcessEnv): AccountAuthConfiguration {
  // Missing authentication values stop startup. Never infer an owner from email.
  const configuration: AccountAuthConfiguration = {
    issuer: environment.AUTH0_ISSUER_BASE_URL || "",
    audience: environment.AUTH0_AUDIENCE || "",
    ownerSubject: environment.AUTH0_OWNER_SUBJECT || "",
    ownerAccountTopic: environment.AUTH0_OWNER_ACCOUNT_TOPIC || "",
    allowedOrigins: (environment.CORS_ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean),
  };
  validateAccountAuthConfiguration(configuration);
  return configuration;
}

export function createAccountAuthentication(configuration: AccountAuthConfiguration): express.RequestHandler[] {
  validateAccountAuthConfiguration(configuration);
  // Pin the issuer and RS256, even when discovery returns other signing options.
  const validateToken = auth({
    issuer: configuration.issuer,
    ...(configuration.jwksUri ? { jwksUri: configuration.jwksUri } : { issuerBaseURL: configuration.issuer }),
    audience: configuration.audience,
    tokenSigningAlg: "RS256",
    authRequired: true,
    validators: { sub: (value) => subjectSchema.safeParse(value).success },
  });
  const bindAccount: express.RequestHandler = (request, response, next) => {
    const subject = subjectSchema.parse(request.auth?.payload.sub);
    // A valid tenant login is insufficient. Only the configured owner can use this deployment.
    if (subject !== configuration.ownerSubject) {
      response.status(403).json({ error: "Personal account access only" });
      return;
    }
    response.locals.accountTopic = configuration.ownerAccountTopic;
    next();
  };
  return [validateToken, bindAccount];
}
