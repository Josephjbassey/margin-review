import pLimit from "p-limit";
import crypto from "crypto";
import {
  clockedAdapters,
  ProtectResult,
  CompareResult,
  VerifyResult,
  RerankResult,
  DecideRequestPayload,
  DecideResult,
} from "./adapters";
import {
  computeCacheKey,
  getCachedResponse,
  setCachedResponse,
} from "./cache";

const CLOCKED_BASE_URL =
  process.env.CLOCKED_BASE_URL || "https://clocked.rezolve.ai/clocked";

const CLOCKED_API_KEY = process.env.CLOCKED_API_KEY || "";
export const MAX_PAIRS = Number(process.env.MAX_PAIRS || 20);

// Worker pool capped at 4 concurrent requests
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
 * Logs credit usage if reported in response; never logs the API key.
 */
async function callClockedApi(
  endpoint: string,
  payload: any,
  options: RequestOptions = {}
): Promise<{ data: any; credits: number }> {
  const maxRetries = options.retries ?? 3;
  let delay = options.initialDelayMs ?? 500;
  const idempotencyKey = crypto.randomUUID();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${CLOCKED_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CLOCKED_API_KEY}`,
          "X-API-Key": CLOCKED_API_KEY,
          "Idempotency-Key": idempotencyKey,
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
        data?.credits_used ?? data?.credits ?? data?.usage?.input_tokens ?? 0
      );

      if (credits > 0) {
        totalCreditsConsumed += credits;
        console.log(
          `[Clocked] Endpoint: ${endpoint} | Credits/Tokens: ${credits} | Total: ${totalCreditsConsumed}`
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

  // 2. Concurrency limited network request (max 4 concurrent workers)
  return limiter(async () => {
    // Re-check cache after queue wait
    const secondCheck = getCachedResponse<any>(cacheKey);
    if (secondCheck) {
      return transform(secondCheck.data);
    }

    try {
      if (!CLOCKED_API_KEY && mockFallback) {
        return mockFallback();
      }

      const { data, credits } = await callClockedApi(endpoint, payload);

      // Save to cache (ignores errors/empty internally)
      setCachedResponse(cacheKey, endpoint, payload, data, credits);

      return transform(data);
    } catch (err) {
      if (mockFallback) {
        console.warn(`[Clocked] Live API call on ${endpoint} failed, falling back to mock:`, (err as Error).message);
        return mockFallback();
      }
      throw err;
    }
  });
}

// --- Endpoints ---

/**
 * 1. PROTECT (POST /clocked/pii):
 * Masks student identifiers (names, matriculation numbers, emails).
 */
export async function protect(
  text: string,
  mockFallback?: () => ProtectResult
): Promise<ProtectResult> {
  const payload = clockedAdapters.protect.toRequest(text);
  return executeWithCache(
    clockedAdapters.protect.endpoint,
    payload,
    (data) => clockedAdapters.protect.fromResponse(data, text),
    mockFallback
  );
}

/**
 * 2. COMPARE (POST /clocked/compare):
 * Compares two submissions for conflicts, duplicates, same facts, or overlaps.
 */
export async function compare(
  docA: { id: string; text: string },
  docB: { id: string; text: string },
  mockFallback?: () => CompareResult
): Promise<CompareResult> {
  const payload = clockedAdapters.compare.toRequest(docA, docB);
  return executeWithCache(
    clockedAdapters.compare.endpoint,
    payload,
    (data) => clockedAdapters.compare.fromResponse(data),
    mockFallback
  );
}

/**
 * 3. VERIFY (POST /clocked/grounding):
 * Checks student claims against course reading pack documents.
 */
export async function verify(
  answer: string,
  sources: Array<{ id: string; text: string }>,
  claims?: string[],
  mockFallback?: () => VerifyResult
): Promise<VerifyResult> {
  const payload = clockedAdapters.verify.toRequest(answer, sources, claims);
  return executeWithCache(
    clockedAdapters.verify.endpoint,
    payload,
    (data) => clockedAdapters.verify.fromResponse(data),
    mockFallback
  );
}

/**
 * 4. RERANK (POST /clocked/rerank):
 * Picks the most relevant reading pack passages for an unsupported/partial claim.
 */
export async function rerank(
  query: string,
  passages: Array<{ id: string; text: string; title?: string }>,
  top_n: number = 5,
  mockFallback?: () => RerankResult
): Promise<RerankResult> {
  const payload = clockedAdapters.rerank.toRequest(query, passages, top_n);
  return executeWithCache(
    clockedAdapters.rerank.endpoint,
    payload,
    (data) => clockedAdapters.rerank.fromResponse(data, query),
    mockFallback
  );
}

/**
 * 5. DECIDE (POST /clocked/decide):
 * Answer named questions with typed decisions (noul, choice, multiselect, score)
 * and the probabilities behind them.
 */
export async function decide(
  payload: DecideRequestPayload,
  mockFallback?: () => DecideResult
): Promise<DecideResult> {
  const reqPayload = clockedAdapters.decide.toRequest(payload);
  return executeWithCache(
    clockedAdapters.decide.endpoint,
    reqPayload,
    (data) => clockedAdapters.decide.fromResponse(data),
    mockFallback
  );
}

