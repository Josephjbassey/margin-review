import fs from "fs";
import os from "os";
import path from "path";
import {
  PipelineDocument,
  PipelinePairFinding,
  PipelineClaimFinding,
  PipelineStepProgress,
} from "./pipeline";
import { DecisionRecord } from "./decisions";
import demoBatchFixture from "@/sample_data/demo_batch_fixture.json";

export interface StoredBatch {
  id: string;
  name: string;
  created_at: string;
  status: "queued" | "running" | "done" | "error";
  current_step: "ingest" | "protect" | "compare" | "verify" | "rerank" | "completed";
  submissions: PipelineDocument[];
  reading_pack: PipelineDocument[];
  pair_findings: PipelinePairFinding[];
  claim_findings: PipelineClaimFinding[];
  decisions: DecisionRecord[];
  progress: Record<string, PipelineStepProgress>;
  total_identifiers_masked: number;
}

const defaultDemoBatch = demoBatchFixture as unknown as StoredBatch;

// In-memory store ensures batches remain available in serverless environments (e.g. Vercel)
const inMemoryBatches = new Map<string, StoredBatch>();
if (defaultDemoBatch && defaultDemoBatch.id) {
  inMemoryBatches.set(defaultDemoBatch.id, defaultDemoBatch);
}

function resolveDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  ) {
    return path.join(os.tmpdir(), "margin_data");
  }
  return path.join(process.cwd(), ".data");
}

let activeDataDir: string | null = null;

function getDataDir(): string {
  if (activeDataDir) return activeDataDir;
  const preferred = resolveDataDir();
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    activeDataDir = preferred;
    return activeDataDir;
  } catch {
    const fallback = path.join(os.tmpdir(), "margin_data");
    try {
      if (!fs.existsSync(/*turbopackIgnore: true*/ fallback)) {
        fs.mkdirSync(fallback, { recursive: true });
      }
    } catch {}
    activeDataDir = fallback;
    return fallback;
  }
}

function getBatchFilePath(batchId: string): string {
  const dir = getDataDir();
  return path.join(dir, `${batchId}.json`);
}

export function saveBatch(batch: StoredBatch): void {
  inMemoryBatches.set(batch.id, batch);
  try {
    const filePath = getBatchFilePath(batch.id);
    fs.writeFileSync(filePath, JSON.stringify(batch, null, 2), "utf-8");
  } catch {
    // Memory store is already populated; safe to ignore filesystem write restrictions
  }
}

export function getBatch(batchId: string): StoredBatch | null {
  // Check memory store first
  const inMem = inMemoryBatches.get(batchId);
  if (inMem) return inMem;

  if (batchId === "batch-demo-gns102" || batchId === defaultDemoBatch?.id) {
    return defaultDemoBatch;
  }

  try {
    const filePath = getBatchFilePath(batchId);
    if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as StoredBatch;
    inMemoryBatches.set(batchId, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function getAllBatches(): StoredBatch[] {
  const batchMap = new Map<string, StoredBatch>();

  // Add in-memory batches first
  for (const [id, b] of inMemoryBatches.entries()) {
    batchMap.set(id, b);
  }

  // Add default demo if not present
  if (defaultDemoBatch && defaultDemoBatch.id && !batchMap.has(defaultDemoBatch.id)) {
    batchMap.set(defaultDemoBatch.id, defaultDemoBatch);
  }

  try {
    const dir = getDataDir();
    if (fs.existsSync(/*turbopackIgnore: true*/ dir)) {
      const files = fs.readdirSync(/*turbopackIgnore: true*/ dir);
      for (const f of files) {
        if (f.endsWith(".json")) {
          try {
            const content = fs.readFileSync(path.join(/*turbopackIgnore: true*/ dir, f), "utf-8");
            const b = JSON.parse(content) as StoredBatch;
            if (b && b.id) {
              batchMap.set(b.id, b);
              inMemoryBatches.set(b.id, b);
            }
          } catch {}
        }
      }
    }
  } catch {
    // Fall back gracefully to memory store
  }

  const batches = Array.from(batchMap.values());
  batches.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return batches;
}

export function deleteBatch(batchId: string): boolean {
  inMemoryBatches.delete(batchId);
  try {
    const filePath = getBatchFilePath(batchId);
    if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return true;
  } catch {
    return true;
  }
}
