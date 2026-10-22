import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

// In-memory cache fallback for serverless cold-starts or read-only environments
const memoryCache = new Map<string, { data: any; credits?: number }>();

function resolveCacheDir(): string {
  if (process.env.CACHE_DIR) {
    return process.env.CACHE_DIR;
  }
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  ) {
    return path.join(os.tmpdir(), "clocked_cache");
  }
  return path.join(process.cwd(), "clocked_cache");
}

let activeCacheDir: string | null = null;

function getCacheDir(): string {
  if (activeCacheDir) return activeCacheDir;
  const preferred = resolveCacheDir();
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    activeCacheDir = preferred;
    return activeCacheDir;
  } catch {
    const fallback = path.join(os.tmpdir(), "clocked_cache");
    try {
      if (!fs.existsSync(fallback)) {
        fs.mkdirSync(fallback, { recursive: true });
      }
    } catch {}
    activeCacheDir = fallback;
    return fallback;
  }
}

function ensureCacheDir() {
  getCacheDir();
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
 * Retrieves a cached response from memory or disk by key, if present.
 */
export function getCachedResponse<T = any>(key: string): { data: T; credits?: number } | null {
  // Check memory cache first
  const inMem = memoryCache.get(key);
  if (inMem) {
    return inMem as { data: T; credits?: number };
  }

  try {
    const dir = getCacheDir();
    const filePath = path.join(dir, `${key}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    const result = { data: parsed.response, credits: parsed.credits };
    memoryCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Saves a valid, successful response to disk cache and memory cache.
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

  // Always keep in memory
  memoryCache.set(key, { data: response, credits });

  try {
    const dir = getCacheDir();
    const filePath = path.join(dir, `${key}.json`);
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
    // Memory cache already set; safe to ignore filesystem write restrictions
    return true;
  }
}

/**
 * Clears all cached Clocked responses.
 */
export function clearCache(): number {
  memoryCache.clear();
  try {
    const dir = getCacheDir();
    if (!fs.existsSync(dir)) return 0;
    const files = fs.readdirSync(dir);
    let count = 0;
    for (const f of files) {
      if (f.endsWith(".json")) {
        fs.unlinkSync(path.join(/*turbopackIgnore: true*/ dir, f));
        count++;
      }
    }
    return count;
  } catch {
    return 0;
  }
}
