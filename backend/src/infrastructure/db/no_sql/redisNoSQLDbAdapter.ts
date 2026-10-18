import { createClient } from "redis";
import { NoSQLDbInterface } from "./noSQLDBInterface";
import { serializeResource, deserializeResource } from "./resourceStorageFormat";
import { conditionalResourceWrite } from "./conditionalResourceWrite";

/** Store complete JSON resources in Redis hashes, including present empty objects. */
export default class RedisDBAdapter implements NoSQLDbInterface {
  constructor(private readonly client: ReturnType<typeof createClient>) {}

  /**
   * Put a resource into Redis using topic as the primary key and resourceId as the secondary key.
   * The content is stored as a hash.
   *
   * @param topic - The primary key, e.g. "production"
   * @param resourceId - The secondary key, e.g. "resourceId"
   * @param content - The content to store as a key-value pair
   * @returns {Promise<boolean>} - Returns true if successfully stored
   */
  async putResource(
    topic: string,
    resourceId: string,
    content: { [key: string]: any }
  ): Promise<boolean> {
    const key = `${topic}:${resourceId}`;
    // Replace atomically so an empty/nonempty transition cannot expose mixed fields.
    await this.client.multi().del(key).hSet(key, serializeResource(content)).exec();
    return true;
  }

  /**
   * Get a resource from Redis using topic and resourceId as the composite key.
   *
   * @param topic - The primary key, e.g. "production"
   * @param resourceId - The secondary key, e.g. "resourceId"
   * @returns {Promise<any>} - The resource if found, otherwise null
   */
  async getResource(topic: string, resourceId: string): Promise<any> {
    const key = `${topic}:${resourceId}`;

    // A provider failure must not masquerade as an absent account resource.
    const data = await this.client.hGetAll(key);
    return deserializeResource(data);
  }

  async compareAndSwapResource(topic: string, resourceId: string, expected: Record<string, unknown> | null, replacement: Record<string, unknown>): Promise<boolean> {
    const applied = await this.client.eval(conditionalResourceWrite, {
      keys: [`${topic}:${resourceId}`],
      arguments: [JSON.stringify(expected), JSON.stringify(serializeResource(replacement))],
    });
    return applied === 1;
  }

  /**
   * Get all resources for a specific topic.
   * In Redis, this can be done by scanning for all keys with the prefix "topic:".
   *
   * @param topic - The primary key, e.g. "production"
   * @returns {Promise<any[]>} - The list of resources under the topic
   */
  async getResources(topic: string): Promise<any[]> {
    const pattern = `${topic}:*`;

    // The HTTP boundary supplies only a validated server-owned namespace.
    const keys = await this.client.keys(pattern);
    return Promise.all(
      keys.map(async (key) => {
        const data = await this.client.hGetAll(key);
        return deserializeResource(data);
      })
    ).then((resources) => resources.filter((resource) => resource !== null));
  }

  /**
   * Delete a specific resource using topic and resourceId.
   *
   * @param topic - The primary key, e.g. "production"
   * @param resourceId - The secondary key, e.g. "resourceId"
   * @returns {Promise<boolean>} - Returns true if successfully deleted
   */
  async deleteResource(topic: string, resourceId: string): Promise<boolean> {
    const key = `${topic}:${resourceId}`;

    await this.client.del(key);
    return true;
  }

  /**
   * Close the connection to the Redis database.
   */
  close(): void {
    this.client.disconnect().catch(console.error);
  }
}
