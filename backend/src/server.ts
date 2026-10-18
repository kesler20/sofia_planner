import "dotenv/config";
import { createApp } from "./app";
import { loadAccountAuthConfiguration } from "./infrastructure/auth/accountAuth";
import { createClient } from "redis";
import redisCredentials from "./infrastructure/credentials/redisCredentials";
import RedisDBAdapter from "./infrastructure/db/no_sql/redisNoSQLDbAdapter";

// Validate authentication before connecting storage or accepting any requests.
const authConfiguration = loadAccountAuthConfiguration(process.env);
const redisClient = createClient(redisCredentials);
redisClient.on("error", () => console.error("Redis connection failed"));
void redisClient.connect().catch(() => {
  /* Client error event logs the failure once. */
});
const app = createApp({
  storage: new RedisDBAdapter(redisClient),
  authConfiguration,
});
app.listen(3000, "0.0.0.0", () =>
  console.info("Headless resource server listening"),
);
