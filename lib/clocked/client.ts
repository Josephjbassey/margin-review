import pLimit from "p-limit";
import {
  clockedAdapters,
  ProtectResult,
  CompareResult,
  VerifyResult,
  RerankResult,
} from "./adapters";
import {
  computeCacheKey,
  getCachedResponse,
  setCachedResponse,
} from "./cache";

const CLOCKED_BASE_URL =
  process.env.CLOCKED_BASE_URL || "https://api.clocked.dev/v1";

const CLOCKED_API_KEY = process.env.CLOCKED_API_KEY || "";
export const MAX_PAIRS = Number(process.env.MAX_PAIRS || 20);

// Concurrency pool capped at 4 concurrent requests
const limiter = pLimit(4);

// In-memory credit tracker
let totalCreditsConsumed = 0;

export function getTotalCreditsConsumed(): number {
  return totalCreditsConsumed;
}

export function resetCreditsCounter(): void {
  totalCreditsConsumed = 0;
}

/**
 * Validates whether the number of submission pairs exceeds MAX_PAIRS.
 */
export function validatePairLimit(submissionCount: number): {
  allowed: boolean;
  pairCount: number;
  maxPairs: number;
} {
  const pairCount = (submissionCount * (submissionCount - 1)) / 2;
  return {
    allowed: pairCount <= MAX_PAIRS,
    pairCount,
    maxPairs: MAX_PAIRS,
  };
}

interface RequestOptions {
  retries?: number;
  initialDelayMs?: number;
}

/**
 * Executes a Clocked API call with retry backoff on 429 and 5xx.
 */
async function callClockedApi(
  endpoint: string,
  payload: any,
  options: RequestOptions = {}
): Promise<{ data: any; credits: number }> {
  const maxRetries = options.retries ?? 3;
  let delay = options.initialDelayMs ?? 500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${CLOCKED_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CLOCKED_API_KEY}`,
          "X-API-Key": CLOCKED_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 429 || response.status >= 500) {
        if (attempt === maxRetries) {
          throw new Error(
            `Clocked API error on ${endpoint}: HTTP ${response.status} ${response.statusText} (after ${maxRetries} retries)`
          );
        }
        // Exponential backoff with jitter
        const jitter = Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay + jitter));
        delay *= 2;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Clocked API error on ${endpoint}: HTTP ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      const credits = Number(
        data?.credits_used ?? data?.credits ?? data?.usage?.credits ?? 0
      );

      if (credits > 0) {
        totalCreditsConsumed += credits;
        console.log(
          `[Clocked] Endpoint: ${endpoint} | Credits Used: ${credits} | Total: ${totalCreditsConsumed}`
        );
      }

      return { data, credits };
    } catch (err: any) {
      if (attempt === maxRetries) {
        throw err;
      }
      const jitter = Math.random() * 200;
      await new Promise((r) => setTimeout(r, delay + jitter));
      delay *= 2;
    }
  }

  throw new Error(`Clocked API failed on ${endpoint}`);
}

/**
 * Generic cached caller wrapping the concurrency limiter and disk cache.
 */
async function executeWithCache<T>(
  endpoint: string,
  payload: any,
  transform: (data: any) => T,
  mockFallback?: () => T
): Promise<T> {
  const cacheKey = computeCacheKey(endpoint, payload);

  // 1. Check disk cache
  const cached = getCachedResponse<any>(cacheKey);
  if (cached) {
    return transform(cached.data);
  }

  // 2. Concurrency limited network request
  return limiter(async () => {
    // Re-check cache after queue wait
    const secondCheck = getCachedResponse<any>(cacheKey);
    if (secondCheck) {
      return transform(secondCheck.data);
    }

    try {
      if (!CLOCKED_API_KEY && mockFallback) {
        const mockData = mockFallback();
        return mockData;
      }

      const { data, credits } = await callClockedApi(endpoint, payload);

      // Save to cache (ignores errors/empty internally)
      setCachedResponse(cacheKey, endpoint, payload, data, credits);

      return transform(data);
    } catch (err) {
      // If live API fails and mockFallback is provided (e.g. offline testing/demo)
      if (mockFallback) {
        console.warn(`[Clocked] Live API call failed, using mock fallback:`, (err as Error).message);
        return mockFallback();
      }
      throw err;
    }
  });
}

// --- Endpoints ---

/**
 * 1. PROTECT: Masks student PII (names, matriculation numbers).
 */
export async function protect(
  text: string,
  mockFallback?: () => ProtectResult
): Promise<ProtectResult> {
  const payload = clockedAdapters.protect.toRequest(text);
  return executeWithCache(
    "/protect",
    payload,
    (data) => clockedAdapters.protect.fromResponse(data, text),
    mockFallback
  );
}

/**
 * 2. COMPARE: Compares a pair of submissions for overlap/conflict.
 */
export async function compare(
  docA: { id: string; text: string },
  docB: { id: string; text: string },
  mockFallback?: () => CompareResult
): Promise<CompareResult> {
  const payload = clockedAdapters.compare.toRequest(docA, docB);
  return executeWithCache(
    "/compare",
    payload,
    (data) => clockedAdapters.compare.fromResponse(data),
    mockFallback
  );
}

/**
 * 3. VERIFY: Ground claims against reading pack documents.
 */
export async function verify(
  claims: string[],
  sources: Array<{ id: string; text: string }>,
  mockFallback?: () => VerifyResult[]
): Promise<VerifyResult[]> {
  const payload = clockedAdapters.verify.toRequest(claims, sources);
  return executeWithCache(
    "/verify",
    payload,
    (data) => {
      if (Array.isArray(data)) {
        return data.map((item, i) =>
          clockedAdapters.verify.fromResponse(item, claims[i] || "")
        );
      }
      return [clockedAdapters.verify.fromResponse(data, claims[0] || "")];
    },
    mockFallback
  );
}

/**
 * 4. RERANK: Picks the top reading pack passages for an unsupported claim.
 */
export async function rerank(
  query: string,
  passages: string[],
  mockFallback?: () => RerankResult
): Promise<RerankResult> {
  const payload = clockedAdapters.rerank.toRequest(query, passages);
  return executeWithCache(
    "/rerank",
    payload,
    (data) => clockedAdapters.rerank.fromResponse(data, query),
    mockFallback
  );
}
