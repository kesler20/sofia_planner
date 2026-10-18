import * as React from "react";
import { NoSQLDbServiceResourceType } from "@lib/types";
import axios, { AxiosError, AxiosHeaders } from "axios";
import { resourceHeaders } from "./auth/resourceSession";
import toastFactory, {
  MessageSeverity,
} from "./components/notification/ToastMessages";

export function buildSearchableText(
  fields: Array<string | number | undefined>
): string {
  return fields.join(" ").toLowerCase();
}

const dbUrl = import.meta.env.VITE_PROD_BACKEND_URL;

const DB_ARRAY_KEY = "key";

function resourceFailure(error: unknown): Error {
  // Callers may log errors. Never carry bearer headers or resource bodies into them.
  if (!axios.isAxiosError(error)) return new Error("Resource request failed");
  return new AxiosError("Resource request failed", error.code, undefined, undefined,
    error.response ? { status: error.response.status, statusText: "", data: undefined, headers: {}, config: { headers: new AxiosHeaders() } } : undefined);
}

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    console.error("Failed to parse resource JSON");
    return undefined;
  }
};

const prepareResourceContent = (resourceContent: string) => {
  const parsedContent = safeJsonParse(resourceContent);
  if (parsedContent === undefined) {
    return resourceContent;
  }

  const normalizedContent = unwrapLegacyArrayValue(parsedContent);

  if (Array.isArray(normalizedContent)) {
    return JSON.stringify({ [DB_ARRAY_KEY]: normalizedContent });
  }

  if (normalizedContent === undefined) {
    return resourceContent;
  }

  return JSON.stringify(normalizedContent);
};

const unwrapLegacyArrayValue = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, DB_ARRAY_KEY)
  ) {
    const legacy = (value as Record<string, unknown>)[DB_ARRAY_KEY];
    if (Array.isArray(legacy)) {
      return legacy;
    }
  }
  return value;
};

const normalizeDbReadPayload = (data: unknown) => {
  let parsedData: unknown =
    typeof data === "string" ? safeJsonParse(data) ?? data : data;

  parsedData = unwrapLegacyArrayValue(parsedData);

  if (parsedData === undefined) {
    return undefined;
  }

  if (typeof parsedData === "string") {
    return parsedData;
  }

  return JSON.stringify(parsedData);
};

// ================== //
//                    //
//   CRUD FROM DB     //
//                    //
// ================== //

// @see server.ts
export const readResourceSnapshot = async (resourcePath: string, resourceName: string): Promise<Record<string, unknown> | null> => {
  try {
    const response = await axios.get(`${dbUrl}/${encodeURIComponent(resourcePath)}/${encodeURIComponent(resourceName)}`, { headers: await resourceHeaders(resourcePath) });
    const value: unknown = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid resource snapshot");
    return value as Record<string, unknown>;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw resourceFailure(error);
  }
};

export const compareAndSwapResourceInDb = async (
  resourcePath: string,
  resourceName: string,
  expected: unknown,
  replacement: unknown
): Promise<void> => {
  const root = dbUrl.replace(/\/resources\/?$/, "");
  const normalize = (value: unknown) => Array.isArray(value) ? { key: value } : value;
  try {
    const response = await axios.put(`${root}/v1/resources/${encodeURIComponent(resourcePath)}/${encodeURIComponent(resourceName)}`, { expected: normalize(expected), replacement: normalize(replacement) }, { headers: await resourceHeaders(resourcePath) });
    if (response.data?.applied !== true) throw new Error("Resource save was not confirmed");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) throw new Error("This resource changed. Refresh before saving.");
    if (axios.isAxiosError(error) && error.response?.status === 404) throw new Error("Conditional saves are unavailable on this backend.");
    throw resourceFailure(error);
  }
};

export const createResourceInDb = async <TResponse>(
  resourcePath: string,
  resourceName: string,
  resourceContent: string
) => {
  const payload = prepareResourceContent(resourceContent);
  try {
    const response = await axios.post<
      NoSQLDbServiceResourceType,
      { data: TResponse }
    >(`${dbUrl}/${encodeURIComponent(resourcePath)}`, {
      resourceName,
      resourceContent: payload,
    }, { headers: await resourceHeaders(resourcePath) });
    const result = response.data;
    return { result, error: undefined };
  } catch (e: any) {
    return { result: undefined, error: resourceFailure(e) };
  }
};

export const readResourceInDb = async <TResponse>(
  resourcePath: string,
  resourceName: string
) => {
  try {
    const response = await axios.get<unknown>(
      `${dbUrl}/${encodeURIComponent(resourcePath)}/${encodeURIComponent(resourceName)}`,
      { headers: await resourceHeaders(resourcePath) }
    );
    const result = normalizeDbReadPayload(response.data) as TResponse;
    return { result, error: undefined };
  } catch (error: any) {
    return { result: undefined, error: resourceFailure(error) };
  }
};

export const deleteResourceInDb = async <TResponse>(
  resourcePath: string,
  resourceName: string
) => {
  try {
    const response = await axios.delete<TResponse>(
      `${dbUrl}/${encodeURIComponent(resourcePath)}/${encodeURIComponent(resourceName)}`,
      { headers: await resourceHeaders(resourcePath) }
    );
    const result = response.data;
    return { result, error: undefined };
  } catch (error: any) {
    return { result: undefined, error: resourceFailure(error) };
  }
};

export const getResourceFromCache = <T>(key: string): T | undefined => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      const result = unwrapLegacyArrayValue(parsed) as T;
      return result;
    }
    return undefined;
  } catch (error) {
    console.error(`Error getting item ${key} from localStorage`, error);
    return undefined;
  }
};

export type ShortCut = {
  shortcut: string[];
  callback: () => void;
};

/**
 * custom hook to handle keyboard shortcuts
 * @param {*} commands
 * @param {*} deps
 * @returns
 * @example
 * const commands = [
 *  {
 *   shortcut: ["Control", "Shift", "S"],
 *  callback: () => {
 *   console.log("Control + Shift + S");
 * },
 * },
 * {
 * shortcut: ["Control", "Shift", "A"],
 * callback: () => {
 * console.log("Control + Shift + A");
 * },
 * },
 * {
 * shortcut: ["Control", "Shift", "D"],
 * callback: () => {
 * console.log("Control + Shift + D");
 * },
 * },
 * ];
 * useKeyboardShortcuts(commands);
 */
export function useKeyboardShortcuts(
  commands: ShortCut[],
  deps: React.DependencyList = []
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKeys = [
        event.ctrlKey ? "Control" : "",
        event.shiftKey ? "Shift" : "",
        event.altKey ? "Alt" : "",
        event.key.toUpperCase(),
      ].filter(Boolean);

      commands.forEach(({ shortcut, callback }) => {
        if (JSON.stringify(pressedKeys) === JSON.stringify(shortcut)) {
          event.preventDefault();
          callback();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [commands, ...deps]);
}

/**
 * custom hook to store values which persist in storage and the state of the context
 * @param {*} defaultValue
 * @param {*} resourcePath
 * @param {*} resourceName
 * @returns
 */
const accountCachePrefix = (account: string) => `sofia/account/${encodeURIComponent(account)}/`;

export function clearAccountCache(account: string): void {
  const prefix = accountCachePrefix(account);
  for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key);
}

export const useCachedValue = <T>(
  username: string,
  defaultValue: T,
  key: string
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const validKey = `${accountCachePrefix(username)}${encodeURIComponent(key)}`;

  const [value, setValue] = React.useState(() => {
    const storedState = getResourceFromCache(validKey);
    return storedState === undefined ? defaultValue : (storedState as T);
  });
  React.useEffect(() => {
    // Persist raw value for generic key/value storage
    try {
      localStorage.setItem(validKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${validKey} in localStorage`, error);
    }
  }, [validKey, value]);
  return [value as T, setValue];
};

export const useStoredValue = <T>(
  username: string,
  defaultValue: T,
  key: string,
  pageLimit?: number,
  validate?: (value: unknown) => T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean, string | null] => {
  const [value, setValue] = React.useState<T>(defaultValue);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const validator = React.useRef(validate);
  validator.current = validate;
  const defaults = React.useRef(defaultValue);
  defaults.current = defaultValue;
  const loaded = React.useRef<{ username: string; key: string; content: string } | null>(null);
  const writes = React.useRef(Promise.resolve());

  React.useEffect(() => {
    let active = true;
    loaded.current = null;
    setIsLoading(true);
    setLoadError(null);
    const load = async () => {
      try {
        const { result, error } = await readResourceInDb<string>(username, key);
        // Only a confirmed missing resource may start from defaults.
        if (error && !(axios.isAxiosError(error) && error.response?.status === 404)) throw error;
        if (!error && result === undefined) throw new Error("Resource read was not confirmed");
        let next = result === undefined ? defaults.current : JSON.parse(result) as T;
        if (validator.current) next = validator.current(next);
        if (pageLimit && Array.isArray(next)) next = next.slice(0, pageLimit) as T;
        if (!active) return;
        loaded.current = { username, key, content: JSON.stringify(next) };
        setValue(next);
      } catch {
        if (!active) return;
        // Keep failed or malformed reads read-only, never persist their defaults.
        setLoadError(`Unable to load ${key}. Refresh before editing.`);
        console.log("Error loading stored resource", key);
        toastFactory(`Failed to load ${key} from database`, MessageSeverity.ERROR);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [username, key, pageLimit]);

  const handleEventChange = React.useCallback<React.Dispatch<React.SetStateAction<T>>>((update) => {
    if (loaded.current?.username !== username || loaded.current?.key !== key) return;
    setValue(update);
  }, [username, key]);

  React.useEffect(() => {
    const source = loaded.current;
    if (isLoading || !source || source.username !== username || source.key !== key) return;
    const content = JSON.stringify(value);
    // Hydration and unchanged values are reads, not edits.
    if (content === source.content) return;
    source.content = content;
    // Serialize edits so a slower old request cannot overwrite a newer one.
    writes.current = writes.current.then(async () => {
      const { error, result } = await createResourceInDb(username, key, content);
      if (error || result === undefined || result === false) {
        console.log("Error saving stored resource", key);
        toastFactory(`Failed to save ${key} to database`, MessageSeverity.ERROR);
      }
    });
  }, [value, isLoading, username, key]);

  const waitingForResource = !loadError && (loaded.current?.username !== username || loaded.current?.key !== key);
  return [value, handleEventChange, isLoading || waitingForResource, loadError];
};
