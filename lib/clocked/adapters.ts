/**
 * Clocked Official Schema Adapters Module
 *
 * Source: https://clocked.rezolve.ai/docs/
 * - Protect: POST /clocked/pii
 * - Compare: POST /clocked/compare
 * - Verify:  POST /clocked/grounding
 * - Rerank:  POST /clocked/rerank
 *
 * All external request/response mapping is isolated in this single file.
 */

// --- Internal Domain Types ---

export interface ProtectEntity {
  type: string;
  value: string;
  start: number;
  end: number;
  confidence: number;
}

export interface ProtectResult {
  masked_text: string;
  entities: ProtectEntity[];
  entities_masked_count: number;
  raw_response: any;
}

export interface PassageOffset {
  char_start: number;
  char_end: number;
  text: string;
  confidence?: number;
}

export interface CompareResult {
  relation: "conflict" | "same_facts" | "duplicate" | "overlap" | "none";
  probability: number;
  passages_a: PassageOffset[];
  passages_b: PassageOffset[];
  raw_response: any;
}

export interface VerifyEvidence {
  source_id: string;
  passage_text: string;
  relation: "supported" | "partial" | "unsupported" | "contradicts";
  char_start?: number;
  char_end?: number;
  confidence?: number;
}

export interface ClaimVerification {
  claim: string;
  status: "supported" | "partial" | "unsupported";
  verdict: string;
  evidence: VerifyEvidence[];
  source_id?: string;
  confidence: number;
}

export interface VerifyResult {
  grounded_score: number;
  overall_verdict: string;
  claims: ClaimVerification[];
  unsupported_claim_indexes: number[];
  raw_response: any;
}

export interface RerankedPassage {
  index: number;
  id?: string;
  action: "use" | "expand" | "skip";
  reason?: string;
  relevance_score: number;
  document_score?: number;
}

export interface RerankResult {
  query: string;
  results: RerankedPassage[];
  raw_response: any;
}

export type DecideQuestion =
  | {
      type: "noul";
      instructions?: string;
      threshold?: number;
      document?: string;
    }
  | {
      type: "choice";
      instructions?: string;
      criteria: Record<string, string>;
      document?: string;
    }
  | {
      type: "multiselect";
      instructions?: string;
      criteria?: Record<string, string>;
      options?: string[];
      threshold?: number;
      document?: string;
    }
  | {
      type: "score";
      instructions?: string;
      criteria: string[];
      document?: string;
    };

export interface DecideRequestPayload {
  state?: string | object | any[];
  pdf?: string;
  instructions?: string;
  calibration_temperature?: number;
  rotations?: number;
  documents?: Array<{ id: string; text: string }>;
  questions: Record<string, DecideQuestion>;
}

export interface DecideResult {
  model?: string;
  answers: Record<string, any>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  raw_response: any;
}

export type ExtractFormat =
  | "text"
  | "integer"
  | "number"
  | "date"
  | "email"
  | "phone"
  | "url"
  | "code";

export interface ExtractFieldDefinition {
  description?: string;
  list?: boolean;
  max_items?: number;
  format?: ExtractFormat;
  normalize?: string | Record<string, any>;
  fields?: Record<string, string | ExtractFieldDefinition>;
  row_anchor?: string;
}

export interface ExtractRequestPayload {
  text?: string;
  pdf?: string;
  pages?: number[] | string;
  pdf_mode?: "auto" | "text" | "image";
  return_text?: boolean;
  instructions?: string;
  return_pdf?: "highlight" | "box" | "redact";
  fields: Record<string, string | ExtractFieldDefinition>;
}

export interface ExtractedSpan {
  value: any;
  start?: number;
  end?: number;
  confidence?: number;
  normalized?: any;
  fields?: Record<string, ExtractedSpan>;
}

export interface ExtractedFieldResult {
  value: any;
  start?: number;
  end?: number;
  confidence?: number;
  items?: ExtractedSpan[];
  row_anchor?: string;
}

export interface ExtractResult {
  model?: string;
  fields: Record<string, ExtractedFieldResult>;
  timing?: Record<string, any>;
  pdf?: Record<string, any>;
  raw_response: any;
}

export type FillFieldType =
  | "extract"
  | "choice"
  | "multiselect"
  | "score"
  | "yes_no"
  | "generate";

export interface FillExtractField {
  type: "extract";
  description?: string;
  infer?: boolean;
  list?: boolean;
  max_items?: number;
  format?: ExtractFormat;
  region?: [number, number];
  unit?: "sentence";
}

export interface FillChoiceField {
  type: "choice";
  description?: string;
  options?: string[];
  options_by?: Record<string, any>;
  allow_none?: boolean;
  temperature?: number;
  rotations?: number;
}

export interface FillMultiselectField {
  type: "multiselect";
  description?: string;
  options: string[];
  threshold?: number;
  temperature?: number;
  rotations?: number;
}

export interface FillScoreField {
  type: "score";
  description?: string;
  levels: string[];
  temperature?: number;
  rotations?: number;
}

export interface FillYesNoField {
  type: "yes_no";
  description?: string;
  threshold?: number;
  temperature?: number;
  rotations?: number;
}

export interface FillGenerateField {
  type: "generate";
  description?: string;
  format?: "text" | "date" | "number";
  max_tokens?: number;
}

export type FillFieldDefinition =
  | FillExtractField
  | FillChoiceField
  | FillMultiselectField
  | FillScoreField
  | FillYesNoField
  | FillGenerateField;

export interface FillRequestPayload {
  text?: string;
  pdf?: string;
  pages?: number[] | string;
  pdf_mode?: "auto" | "text" | "image";
  return_text?: boolean;
  instructions?: string;
  reference_date?: string;
  return_pdf?: "highlight" | "box" | "redact";
  fields: Record<string, FillFieldDefinition>;
}

export interface FilledFieldResult {
  value: any;
  start?: number;
  end?: number;
  confidence?: number;
  probabilities?: Record<string, number> | number[];
  expected?: number;
  source?: "generated" | string;
  items?: Array<{
    value: any;
    start?: number;
    end?: number;
    confidence?: number;
  }>;
}

export interface FillResult {
  model?: string;
  fields: Record<string, FilledFieldResult>;
  timing?: Record<string, any>;
  pdf?: Record<string, any>;
  raw_response: any;
}

// --- Adapters ---

export const clockedAdapters = {
  // 1. PROTECT: POST /clocked/pii
  protect: {
    endpoint: "/pii",
    toRequest(text: string) {
      return {
        text,
        entities: {
          person: "Full names of people or students",
          student_id: "Student matriculation numbers or IDs (e.g. CS/2024/019 or MAT-102)",
          email: "Email addresses",
        },
        anonymize: "replace",
        threshold: 0.5,
      };
    },
    fromResponse(data: any, originalText: string): ProtectResult {
      const masked_text = data?.anonymized_text || originalText;
      const rawEntities = Array.isArray(data?.entities) ? data.entities : [];

      const entities: ProtectEntity[] = rawEntities.map((e: any) => ({
        type: String(e.type || "pii"),
        value: String(e.value || ""),
        start: Number(e.start ?? 0),
        end: Number(e.end ?? 0),
        confidence: Number(e.confidence ?? 1),
      }));

      return {
        masked_text,
        entities,
        entities_masked_count: entities.length,
        raw_response: data,
      };
    },
  },

  // 2. COMPARE: POST /clocked/compare
  compare: {
    endpoint: "/compare",
    toRequest(docA: { id: string; text: string }, docB: { id: string; text: string }) {
      return {
        documents: [
          { id: docA.id, text: docA.text },
          { id: docB.id, text: docB.text },
        ],
        threshold: 0.5,
        evidence: "flagged",
        kinds: true,
      };
    },
    fromResponse(data: any): CompareResult {
      // Clocked returns pairs array: data.pairs[0]
      const pair = Array.isArray(data?.pairs) && data.pairs.length > 0 ? data.pairs[0] : data;

      const rawRel = String(pair?.relation || data?.verdict || "unrelated").toLowerCase();

      let relation: CompareResult["relation"] = "none";
      if (rawRel.includes("conflict") || rawRel.includes("conflicting")) {
        relation = "conflict";
      } else if (rawRel.includes("same")) {
        relation = "same_facts";
      } else if (rawRel.includes("dup") || data?.verdict === "duplicates") {
        relation = "duplicate";
      } else if (rawRel.includes("overlap") || rawRel.includes("overlapping")) {
        relation = "overlap";
      }

      // Probability calculation: prefer specific probability, then related
      const probability = Number(
        pair?.probabilities?.[rawRel] ??
        pair?.related ??
        pair?.probability ??
        0
      );

      const passages_a: PassageOffset[] = [];
      const passages_b: PassageOffset[] = [];

      // Extract duplicates findings if present
      if (Array.isArray(pair?.duplicates)) {
        for (const item of pair.duplicates) {
          if (item?.a) {
            passages_a.push({
              char_start: Number(item.a.start ?? 0),
              char_end: Number(item.a.end ?? 0),
              text: String(item.a.quote ?? ""),
              confidence: Number(item.confidence ?? 1),
            });
          }
          if (item?.b) {
            passages_b.push({
              char_start: Number(item.b.start ?? 0),
              char_end: Number(item.b.end ?? 0),
              text: String(item.b.quote ?? ""),
              confidence: Number(item.confidence ?? 1),
            });
          }
        }
      }

      // Extract conflicts findings if present
      if (Array.isArray(pair?.conflicts)) {
        for (const item of pair.conflicts) {
          if (item?.a) {
            passages_a.push({
              char_start: Number(item.a.start ?? 0),
              char_end: Number(item.a.end ?? 0),
              text: String(item.a.quote ?? ""),
              confidence: Number(item.confidence ?? 1),
            });
          }
          if (item?.b) {
            passages_b.push({
              char_start: Number(item.b.start ?? 0),
              char_end: Number(item.b.end ?? 0),
              text: String(item.b.quote ?? ""),
              confidence: Number(item.confidence ?? 1),
            });
          }
        }
      }

      return {
        relation,
        probability,
        passages_a,
        passages_b,
        raw_response: data,
      };
    },
  },

  // 3. VERIFY: POST /clocked/grounding
  verify: {
    endpoint: "/grounding",
    toRequest(
      answer: string,
      sources: Array<{ id: string; text: string }>,
      claims?: string[]
    ) {
      return {
        documents: sources.map((s) => ({ id: s.id, text: s.text })),
        answer,
        ...(claims && claims.length > 0 ? { claims } : {}),
        evidence: "all",
        threshold: 0.5,
      };
    },
    fromResponse(data: any): VerifyResult {
      const grounded_score = Number(data?.grounded ?? 0);
      const overall_verdict = String(data?.verdict ?? "unsupported");
      const unsupported_claim_indexes: number[] = Array.isArray(data?.unsupported_claims)
        ? data.unsupported_claims
        : [];

      const rawClaims = Array.isArray(data?.claims) ? data.claims : [];
      const parsedClaims: ClaimVerification[] = rawClaims.map((c: any) => {
        const rawVerdict = String(c?.verdict ?? "unsupported").toLowerCase();
        let status: ClaimVerification["status"] = "unsupported";
        if (rawVerdict.includes("support")) {
          status = "supported";
        } else if (rawVerdict.includes("part")) {
          status = "partial";
        }

        const evidence: VerifyEvidence[] = [];
        if (c?.evidence) {
          const evRel = status === "supported" ? "supported" : rawVerdict.includes("contra") ? "contradicts" : "unsupported";
          evidence.push({
            source_id: String(c.evidence.document || c.source || "reading-pack"),
            passage_text: String(c.evidence.quote || ""),
            relation: evRel,
            char_start: Number(c.evidence.start ?? 0),
            char_end: Number(c.evidence.end ?? 0),
            confidence: Number(c.evidence.confidence ?? 1),
          });
        }

        return {
          claim: String(c?.claim || ""),
          status,
          verdict: rawVerdict,
          evidence,
          source_id: c?.source ? String(c.source) : undefined,
          confidence: Number(c?.supported ?? (status === "supported" ? 0.95 : 0.1)),
        };
      });

      return {
        grounded_score,
        overall_verdict,
        claims: parsedClaims,
        unsupported_claim_indexes,
        raw_response: data,
      };
    },
  },

  // 4. RERANK: POST /clocked/rerank
  rerank: {
    endpoint: "/rerank",
    toRequest(query: string, passages: Array<{ id: string; text: string; title?: string }>, top_n?: number) {
      return {
        query,
        documents: passages.map((p) => ({
          id: p.id,
          text: p.text,
          ...(p.title ? { title: p.title } : {}),
        })),
        ...(top_n ? { top_n } : {}),
      };
    },
    fromResponse(data: any, query: string): RerankResult {
      const rawResults = Array.isArray(data?.results) ? data.results : [];
      const results: RerankedPassage[] = rawResults.map((r: any) => ({
        index: Number(r.index ?? 0),
        id: r.id ? String(r.id) : undefined,
        action: (r.action as "use" | "expand" | "skip") || "use",
        reason: r.reason ? String(r.reason) : undefined,
        relevance_score: Number(r.relevance_score ?? 0),
        document_score: r.document_score ? Number(r.document_score) : undefined,
      }));

      return {
        query,
        results,
        raw_response: data,
      };
    },
  },

  // 5. DECIDE: POST /clocked/decide
  decide: {
    endpoint: "/decide",
    toRequest(payload: DecideRequestPayload) {
      return payload;
    },
    fromResponse(data: any): DecideResult {
      return {
        model: data?.model,
        answers: data?.answers || {},
        usage: data?.usage,
        raw_response: data,
      };
    },
  },

  // 6. EXTRACT: POST /clocked/extract
  extract: {
    endpoint: "/extract",
    toRequest(payload: ExtractRequestPayload) {
      return payload;
    },
    fromResponse(data: any): ExtractResult {
      const rawFields = data?.fields || {};
      const fields: Record<string, ExtractedFieldResult> = {};

      for (const [key, val] of Object.entries(rawFields)) {
        const v = val as any;
        fields[key] = {
          value: v?.value ?? null,
          start: typeof v?.start === "number" ? v.start : undefined,
          end: typeof v?.end === "number" ? v.end : undefined,
          confidence: typeof v?.confidence === "number" ? v.confidence : 1,
          items: Array.isArray(v?.items)
            ? v.items.map((it: any) => ({
                value: it?.value ?? null,
                start: it?.start,
                end: it?.end,
                confidence: it?.confidence ?? 1,
                normalized: it?.normalized,
                fields: it?.fields,
              }))
            : undefined,
          row_anchor: v?.row_anchor,
        };
      }

      return {
        model: data?.model,
        fields,
        timing: data?.timing,
        pdf: data?.pdf,
        raw_response: data,
      };
    },
  },

  // 7. FILL: POST /clocked/fill
  fill: {
    endpoint: "/fill",
    toRequest(payload: FillRequestPayload) {
      return payload;
    },
    fromResponse(data: any): FillResult {
      const rawFields = data?.fields || {};
      const fields: Record<string, FilledFieldResult> = {};

      for (const [key, val] of Object.entries(rawFields)) {
        const v = val as any;
        fields[key] = {
          value: v?.value ?? null,
          start: typeof v?.start === "number" ? v.start : undefined,
          end: typeof v?.end === "number" ? v.end : undefined,
          confidence: typeof v?.confidence === "number" ? v.confidence : undefined,
          probabilities: v?.probabilities,
          expected: v?.expected,
          source: v?.source,
          items: Array.isArray(v?.items)
            ? v.items.map((it: any) => ({
                value: it?.value ?? null,
                start: it?.start,
                end: it?.end,
                confidence: it?.confidence,
              }))
            : undefined,
        };
      }

      return {
        model: data?.model,
        fields,
        timing: data?.timing,
        pdf: data?.pdf,
        raw_response: data,
      };
    },
  },
};



