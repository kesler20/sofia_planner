// Redis cannot retain a hash with no fields. This field represents a present
// empty JSON resource internally and never appears in the public resource body.
export const emptyResourceField = "__headless_empty_resource__";

export function serializeResource(content: Record<string, unknown>): Record<string, string> {
  if (Object.prototype.hasOwnProperty.call(content, emptyResourceField)) throw new Error("Reserved resource field");
  const serialized = Object.fromEntries(Object.entries(content).map(([field, value]) => [field, JSON.stringify(value)]));
  return Object.keys(serialized).length ? serialized : { [emptyResourceField]: "1" };
}

export function deserializeResource(content: Record<string, string>): Record<string, unknown> | null {
  const entries = Object.entries(content);
  if (!entries.length) return null;
  if (Object.prototype.hasOwnProperty.call(content, emptyResourceField)) {
    if (entries.length !== 1 || content[emptyResourceField] !== "1") throw new Error("Invalid empty resource storage");
    return {};
  }
  return Object.fromEntries(entries.map(([field, value]) => [field, JSON.parse(value)]));
}
