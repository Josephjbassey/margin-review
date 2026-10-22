import fs from "fs";
import path from "path";
import {
  PipelineDocument,
  PipelinePairFinding,
  PipelineClaimFinding,
  PipelineStepProgress,
} from "./pipeline";
import { DecisionRecord } from "./decisions";

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

const DATA_DIR = path.join(process.cwd(), ".data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getBatchFilePath(batchId: string): string {
  ensureDataDir();
  return path.join(DATA_DIR, `${batchId}.json`);
}

export function saveBatch(batch: StoredBatch): void {
  ensureDataDir();
  const filePath = getBatchFilePath(batch.id);
  fs.writeFileSync(filePath, JSON.stringify(batch, null, 2), "utf-8");
}

export function getBatch(batchId: string): StoredBatch | null {
  try {
    const filePath = getBatchFilePath(batchId);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as StoredBatch;
  } catch {
    return null;
  }
}

export function getAllBatches(): StoredBatch[] {
  ensureDataDir();
  try {
    const files = fs.readdirSync(DATA_DIR);
    const batches: StoredBatch[] = [];
    for (const f of files) {
      if (f.endsWith(".json")) {
        try {
          const content = fs.readFileSync(path.join(DATA_DIR, f), "utf-8");
          batches.push(JSON.parse(content));
        } catch {}
      }
    }
    // Sort newest first
    batches.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return batches;
  } catch {
    return [];
  }
}

export function deleteBatch(batchId: string): boolean {
  try {
    const filePath = getBatchFilePath(batchId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
