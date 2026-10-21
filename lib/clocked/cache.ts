import crypto from "crypto";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "clocked_cache");

// Ensure cache directory exists
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Deterministically stringifies an object by recursively sorting its keys.
 */
export function canonicalJson(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJson).join(",") + "]";
  }

  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
  return "{" + pairs.join(",") + "}";
}

/**
 * Computes the sha256 hash key for an endpoint call and payload.
 */
export function computeCacheKey(endpoint: string, payload: any): string {
  const canonical = canonicalJson(payload);
  return crypto.createHash("sha256").update(`${endpoint}:${canonical}`).digest("hex");
}

/**
 * Checks if a response is empty or failed (should never be cached).
 */
export function isInvalidResponse(data: any): boolean {
  if (!data) return true;
  if (typeof data !== "object") return false;
  if (data.error || data.detail || data.status === "error") return true;

  // Empty object or empty array
  const keys = Object.keys(data);
  if (keys.length === 0) return true;

  return false;
}

/**
 * Retrieves a cached response from disk by key, if present.
 */
export function getCachedResponse<T = any>(key: string): { data: T; credits?: number } | null {
  try {
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    return { data: parsed.response, credits: parsed.credits };
  } catch {
    return null;
  }
}

/**
 * Saves a valid, successful response to disk cache.
 * Refuses to cache failed or empty responses.
 */
export function setCachedResponse(
  key: string,
  endpoint: string,
  payload: any,
  response: any,
  credits: number = 0
): boolean {
  if (isInvalidResponse(response)) {
    return false;
  }

  try {
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const record = {
      key,
      endpoint,
      payload,
      response,
      credits,
      cached_at: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`[Clocked Cache] Failed to write cache key ${key}:`, err);
    return false;
  }
}

/**
 * Clears all cached Clocked responses.
 */
export function clearCache(): number {
  try {
    ensureCacheDir();
    const files = fs.readdirSync(CACHE_DIR);
    let count = 0;
    for (const f of files) {
      if (f.endsWith(".json")) {
        fs.unlinkSync(path.join(CACHE_DIR, f));
        count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}
