import * as express from "express";
import cors from "cors";
import * as z from "zod";
import { NoSQLDbInterface } from "./infrastructure/db/no_sql/noSQLDBInterface";
import { ResourceUseCase, ResourceCommand } from "./use_cases/resourceUseCase";
import { emptyResourceField } from "./infrastructure/db/no_sql/resourceStorageFormat";
import { AccountAuthConfiguration, createAccountAuthentication, resourceNameSchema } from "./infrastructure/auth/accountAuth";

const resourceSchema = z.record(z.unknown()).refine((value) => !Object.prototype.hasOwnProperty.call(value, emptyResourceField));

class ResourceRequestError extends Error {}

function parseRequestResource(content: string): Record<string, unknown> {
  // Only request decoding errors are client errors. Stored corruption propagates.
  let value: unknown;
  try { value = JSON.parse(content); }
  catch (error) { if (error instanceof SyntaxError) throw new ResourceRequestError(); throw error; }
  return resourceSchema.parse(value);
}
const conditionalSaveSchema = z.object({ expected: resourceSchema.nullable(), replacement: resourceSchema });
const postSchema = z.object({ resourceName: resourceNameSchema, resourceContent: z.string() });

// The factory has no Redis connection or listener side effects. Verification uses
// real JWT middleware with synthetic storage and an isolated local JWKS endpoint.
export function createApp(dependencies: {
  storage: NoSQLDbInterface;
  authConfiguration: AccountAuthConfiguration;
}): express.Express {
  const app = express.default();
  const useCase = new ResourceUseCase(dependencies.storage);
  const authenticate = createAccountAuthentication(dependencies.authConfiguration);
  app.disable("x-powered-by");
  app.use(cors({ origin: dependencies.authConfiguration.allowedOrigins, credentials: false }));
  // Account responses cannot be reused by intermediary or shared browser caches.
  app.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
  app.use(["/resources", "/v1/resources", "/v1/account"], ...authenticate);
  app.use(express.json());
  app.get("/v1/account", (_request, response) => { response.json({ topic: response.locals.accountTopic }); });

  const route = (handler: (request: express.Request, response: express.Response) => Promise<void>): express.RequestHandler =>
    (request, response, next) => { void handler(request, response).catch(next); };

  // Legacy paths accept the resolved owner only. A caller cannot choose an owner.
  const owner: express.RequestHandler = (request, response, next) => {
    if (request.params.topic !== "me" && request.params.topic !== response.locals.accountTopic) {
      response.status(403).json({ error: "Account access denied" });
      return;
    }
    if (request.params.resourceName !== undefined && !resourceNameSchema.safeParse(request.params.resourceName).success) {
      response.status(400).json({ error: "Invalid resource identifier" });
      return;
    }
    next();
  };

  const execute = async (response: express.Response, command: ResourceCommand, successStatus = 200): Promise<void> => {
    const result = await useCase.execute(response.locals.accountTopic, command);
    if (result.outcome === "missing") response.status(404).json({ error: "Resource not found" });
    else if (result.outcome === "conflict") response.status(409).json({ applied: false });
    else response.status(successStatus).json(result.value);
  };

  app.put("/v1/resources/:topic/:resourceName", owner, route(async (request, response) => {
    const { expected, replacement } = conditionalSaveSchema.parse(request.body);
    await execute(response, { operation: "compareAndSwap", resourceName: request.params.resourceName, expected, replacement });
  }));
  app.post("/resources/:topic", owner, route(async (request, response) => {
    const { resourceName, resourceContent } = postSchema.parse(request.body);
    await execute(response, { operation: "save", resourceName, content: parseRequestResource(resourceContent) }, 201);
  }));
  app.get("/resources/:topic/:resourceName", owner, route(async (request, response) => {
    await execute(response, { operation: "read", resourceName: request.params.resourceName });
  }));
  app.get("/resources/:topic", owner, route(async (_request, response) => {
    await execute(response, { operation: "list" });
  }));
  app.put("/resources/:topic/:resourceName", owner, route(async (request, response) => {
    const { content } = z.object({ content: z.string() }).parse(request.body);
    await execute(response, { operation: "replace", resourceName: request.params.resourceName, content: parseRequestResource(content) });
  }));
  app.delete("/resources/:topic/:resourceName", owner, route(async (request, response) => {
    await execute(response, { operation: "delete", resourceName: request.params.resourceName });
  }));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : undefined;
    if (status === 401 || status === 403) {
      if (status === 401) response.set("WWW-Authenticate", "Bearer");
      response.status(status).json({ error: status === 401 ? "Authentication required" : "Account access denied" });
    } else if (error instanceof z.ZodError || error instanceof ResourceRequestError || status === 400) {
      response.status(400).json({ error: "Invalid resource request" });
    } else if (status === 413) {
      response.status(413).json({ error: "Resource request too large" });
    } else {
      // Payloads, claims, identity bindings and provider error details stay private.
      console.error("Resource request failed");
      response.status(500).json({ error: "Resource request failed" });
    }
  });
  return app;
}
