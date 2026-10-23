import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ingestFiles } from "@/lib/ingestion";
import { runFullPipeline } from "@/lib/pipeline";
import { saveBatch, StoredBatch } from "@/lib/storage";
import { recordDecision } from "@/lib/decisions";

export async function POST() {
  try {
    const sampleDir = path.join(process.cwd(), "sample_data");

    const submissionFiles = [
      "essay_01_alice.txt",
      "essay_02_bob.txt",
      "essay_03_clara.txt",
      "essay_04_david.txt",
      "essay_05_elena.txt",
      "essay_06_fiona.txt",
    ];

    const readingFiles = [
      "reading_pack_ch4_convergence.txt",
      "reading_pack_ch7_complexity.txt",
    ];

    const subBuffers = submissionFiles.map((name) => ({
      name,
      buffer: fs.readFileSync(path.join(sampleDir, name)),
    }));

    const readBuffers = readingFiles.map((name) => ({
      name,
      buffer: fs.readFileSync(path.join(sampleDir, name)),
    }));

    const parsed = await ingestFiles(subBuffers, readBuffers);

    const submissions = parsed
      .filter((d) => d.kind === "submission")
      .map((d, i) => ({
        id: `doc-sub-${i + 1}`,
        filename: d.filename,
        kind: d.kind,
        text: d.text,
        masked_text: "",
        label: d.label,
      }));

    const readingPack = parsed
      .filter((d) => d.kind === "reading")
      .map((d, i) => ({
        id: `doc-read-${i + 1}`,
        filename: d.filename,
        kind: d.kind,
        text: d.text,
        masked_text: d.text,
        label: d.label,
      }));

    const batchId = "batch-demo-gns102";

    const pipelineOutput = await runFullPipeline(
      submissions,
      readingPack,
      undefined,
      {
        protect: (doc) => {
          const masked = doc.text
            .replace(/Student Name: [^\n]+/g, "Student Name: <PERSON>")
            .replace(/Student ID: [^\n]+/g, "Student ID: <STUDENT_ID>")
            .replace(/Email: [^\n]+/g, "Email: <EMAIL>");
          return {
            masked_text: masked,
            entities: [
              { type: "person", value: "Student Name", start: 0, end: 20, confidence: 1 },
              { type: "student_id", value: "Student ID", start: 25, end: 40, confidence: 1 },
              { type: "email", value: "Email", start: 45, end: 65, confidence: 1 },
            ],
            entities_masked_count: 3,
            raw_response: { status: "success" },
          };
        },
        compare: (docA, docB) => {
          if (
            (docA.label === "S-01" && docB.label === "S-02") ||
            (docA.label === "S-02" && docB.label === "S-01")
          ) {
            return {
              relation: "conflict",
              probability: 0.98,
              passages_a: [
                {
                  char_start: 367,
                  char_end: 423,
                  text: "the deterministic verification algorithm converged in exactly 45 iterations",
                  confidence: 0.98,
                },
              ],
              passages_b: [
                {
                  char_start: 367,
                  char_end: 424,
                  text: "the deterministic verification algorithm converged in exactly 120 iterations",
                  confidence: 0.98,
                },
              ],
              raw_response: {
                verdict: "conflicts",
                conflicts: [
                  {
                    kind: "contradiction",
                    a: { quote: "converged in exactly 45 iterations", start: 367, end: 423 },
                    b: { quote: "converged in exactly 120 iterations", start: 367, end: 424 },
                  },
                ],
              },
            };
          }

          if (
            (docA.label === "S-03" && docB.label === "S-04") ||
            (docA.label === "S-04" && docB.label === "S-03")
          ) {
            return {
              relation: "same_facts",
              probability: 0.91,
              passages_a: [
                {
                  char_start: 357,
                  char_end: 462,
                  text: "our experimental model checker reduced visited states by an average factor of 3.4x without losing soundness",
                  confidence: 0.91,
                },
              ],
              passages_b: [
                {
                  char_start: 337,
                  char_end: 442,
                  text: "this technique reduced visited states by an average factor of 3.4x without losing soundness",
                  confidence: 0.91,
                },
              ],
              raw_response: { verdict: "same_facts" },
            };
          }

          if (
            (docA.label === "S-05" && docB.label === "S-06") ||
            (docA.label === "S-06" && docB.label === "S-05")
          ) {
            return {
              relation: "duplicate",
              probability: 0.96,
              passages_a: [
                {
                  char_start: 226,
                  char_end: 430,
                  text: "Linear Temporal Logic (LTL) provides a rigorous mathematical framework for specifying qualitative temporal behaviors in reactive computing systems. We convert LTL formulas into generalized Büchi automata",
                  confidence: 0.96,
                },
              ],
              passages_b: [
                {
                  char_start: 236,
                  char_end: 440,
                  text: "Linear Temporal Logic (LTL) offers a rigorous mathematical framework for specifying qualitative temporal properties in reactive computer systems. In our experiment, LTL specifications are translated",
                  confidence: 0.96,
                },
              ],
              raw_response: { verdict: "duplicates" },
            };
          }

          return {
            relation: "none",
            probability: 0.05,
            passages_a: [],
            passages_b: [],
            raw_response: { verdict: "none" },
          };
        },
        verify: (doc: any) => {
          const text = doc.text || "";
          if (text.includes("quantum")) {
            return {
              grounded_score: 0.05,
              overall_verdict: "unsupported",
              claims: [
                {
                  claim: "Quantum teleportation enables exponential acceleration of verification queries.",
                  status: "unsupported" as const,
                  verdict: "not_supported",
                  evidence: [],
                  confidence: 0.02,
                },
              ],
              unsupported_claim_indexes: [0],
              raw_response: { status: "unsupported" },
            };
          }

          return {
            grounded_score: 0.92,
            overall_verdict: "supported",
            claims: [
              {
                claim: "Automated bounded model checking verifies cyclic concurrent state transition systems.",
                status: "supported" as const,
                verdict: "supported",
                evidence: [
                  {
                    source_id: "R-01",
                    passage_text: "Chapter 4: Theorem 4.1 establishes bounded model checking completeness for cyclic transitions.",
                    relation: "supported" as const,
                    confidence: 0.95,
                  },
                ],
                confidence: 0.95,
              },
            ],
            unsupported_claim_indexes: [],
            raw_response: { status: "supported" },
          };
        },
        rerank: (claim: any) => {
          return {
            query: claim.text || "",
            results: [
              { index: 0, id: "R-01", action: "use", relevance_score: 0.94 },
              { index: 1, id: "R-02", action: "skip", relevance_score: 0.2 },
            ],
            raw_response: { results: [] },
          };
        },
      }
    );

    const demoBatch: StoredBatch = {
      id: batchId,
      name: "GNS102 Informatics & Formal Methods (Autumn 2026)",
      created_at: new Date().toISOString(),
      status: "done",
      current_step: "completed",
      submissions: pipelineOutput.maskedSubmissions,
      reading_pack: readingPack,
      pair_findings: pipelineOutput.pairFindings,
      claim_findings: pipelineOutput.claimFindings,
      decisions: [],
      progress: {
        ingest: { step: "ingest", done: 8, total: 8, state: "done" },
        protect: { step: "protect", done: 6, total: 6, state: "done" },
        compare: { step: "compare", done: 15, total: 15, state: "done" },
        verify: { step: "verify", done: 6, total: 6, state: "done" },
        rerank: { step: "rerank", done: 1, total: 1, state: "done" },
      },
      total_identifiers_masked: pipelineOutput.totalIdentifiersMasked,
    };

    saveBatch(demoBatch);

    const finding = demoBatch.pair_findings[0];
    if (finding) {
      recordDecision(
        batchId,
        "pair",
        finding.id,
        "flag",
        "Discrepancy in empirical convergence iterations (45 vs 120). Both students claim to have run the same Alpha benchmark suite."
      );
    }

    return NextResponse.json({
      success: true,
      batch: demoBatch,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate demo batch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
