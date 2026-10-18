import { NoSQLDbInterface } from "../infrastructure/db/no_sql/noSQLDBInterface";

type Resource = Record<string, unknown>;
export type ResourceCommand =
  | { operation: "read" | "delete"; resourceName: string }
  | { operation: "list" }
  | { operation: "save" | "replace"; resourceName: string; content: Resource }
  | { operation: "compareAndSwap"; resourceName: string; expected: Resource | null; replacement: Resource };

export type ResourceResult =
  | { outcome: "ok"; value: unknown }
  | { outcome: "missing" }
  | { outcome: "conflict" };

// Account authorization and request validation precede this storage orchestration.
export class ResourceUseCase {
  constructor(private readonly storage: NoSQLDbInterface) {}

  async execute(topic: string, command: ResourceCommand): Promise<ResourceResult> {
    switch (command.operation) {
      case "read": {
        const resource = await this.storage.getResource(topic, command.resourceName);
        return resource === null ? { outcome: "missing" } : { outcome: "ok", value: resource };
      }
      case "list": return { outcome: "ok", value: await this.storage.getResources(topic) };
      case "compareAndSwap": {
        const applied = await this.storage.compareAndSwapResource(topic, command.resourceName, command.expected, command.replacement);
        return applied ? { outcome: "ok", value: { applied: true } } : { outcome: "conflict" };
      }
      case "replace":
        if (await this.storage.getResource(topic, command.resourceName) === null) return { outcome: "missing" };
        // A legacy replacement keeps the same storage operation as an explicit save.
      case "save":
        if (!await this.storage.putResource(topic, command.resourceName, command.content)) throw new Error("Resource save failed");
        return { outcome: "ok", value: true };
      case "delete":
        if (!await this.storage.deleteResource(topic, command.resourceName)) throw new Error("Resource deletion failed");
        return { outcome: "ok", value: true };
    }
  }
}
