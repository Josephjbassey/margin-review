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

export interface ProtectOptions {
  entities?:
    | string[]
    | Record<string, string | null | { description?: string; format?: string }>;
  anonymize?: "replace" | "mask" | "hash" | "redact" | Record<string, string>;
  threshold?: number;
  mask_keep?: number;
  max_items?: number;
  allow?: string[];
  deny?: string[] | Record<string, string>;
  instructions?: string;
}

export interface ProtectEntity {
  type: string;
  value: string;
  start: number;
  end: number;
  confidence: number;
  source?: string;
}

export interface ProtectResult {
  masked_text: string;
  entities: ProtectEntity[];
  counts?: Record<string, number>;
  entities_masked_count: number;
  raw_response: any;
}

export interface PassageOffset {
  char_start: number;
  char_end: number;
  text: string;
  confidence?: number;
}

export interface ComparePassage {
  document: string;
  quote: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface CompareFinding {
  kind?: string;
  kinds?: Record<string, number>;
  confidence?: number;
  a: ComparePassage;
  b: ComparePassage;
}

export interface ComparePairResult {
  a: string;
  b: string;
  relation: "same" | "overlapping" | "conflicting" | "unrelated" | string;
  related?: number;
  probabilities?: Record<string, number>;
  duplicates?: CompareFinding[];
  conflicts?: CompareFinding[];
}

export interface CompareOptions {
  instructions?: string;
  threshold?: number;
  evidence?: "all" | "flagged" | "none";
  kinds?: boolean;
  rotations?: number;
  debug?: boolean;
  return_pdf?: "highlight" | "box" | "redact";
}

export interface CompareDocumentInput {
  id?: string;
  text?: string;
  pdf?: string;
  pages?: string;
  date?: string;
}

export interface CompareRequestPayload {
  documents: Array<string | CompareDocumentInput>;
  return_pdf?: "highlight" | "box" | "redact";
  instructions?: string;
  threshold?: number;
  evidence?: "all" | "flagged" | "none";
  kinds?: boolean;
  rotations?: number;
  debug?: boolean;
}

export interface CompareResult {
  model?: string;
  verdict?: string;
  relation: "conflict" | "same_facts" | "duplicate" | "overlap" | "none";
  official_relation?: string;
  probability: number;
  related?: number;
  probabilities?: Record<string, number>;
  passages_a: PassageOffset[];
  passages_b: PassageOffset[];
  findings?: CompareFinding[];
  duplicates?: CompareFinding[];
  conflicts?: CompareFinding[];
  pairs?: ComparePairResult[];
  documents?: any[];
  duplicates_indexes?: number[];
  overlaps_indexes?: number[];
  conflicts_indexes?: number[];
  related_pairs_indexes?: number[];
  instructions_used?: string;
  stages?: Record<string, any>;
  pdf?: any[];
  timing?: Record<string, any>;
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
  kind?: string;
  counted?: boolean;
  weight?: number;
  supported?: number;
  contradicted?: number;
  not_stated?: number;
  not_a_claim?: number;
  evidence: VerifyEvidence[];
  source_id?: string;
  sources?: Record<string, any>;
  confidence: number;
}

export interface VerifyOptions {
  question?: string;
  claims?: string[];
  instructions?: string;
  threshold?: number;
  evidence?: "all" | "flagged" | "none";
  rotations?: number;
  pdf?: string;
  return_pdf?: "highlight" | "box" | "redact";
}

export interface VerifyRequestPayload {
  documents?: Array<string | { id: string; text: string }>;
  pdf?: string;
  return_pdf?: "highlight" | "box" | "redact";
  answer: string;
  question?: string;
  claims?: string[];
  instructions?: string;
  threshold?: number;
  evidence?: "all" | "flagged" | "none";
  rotations?: number;
}

export interface VerifyResult {
  model?: string;
  instructions_used?: string;
  grounded?: number;
  grounded_score: number; // alias for backwards compatibility
  ungrounded?: number;
  verdict?: string;
  overall_verdict: string; // alias for backwards compatibility
  threshold?: number;
  claims: ClaimVerification[];
  documents?: Array<{ id: string; share?: number; share_of_answer?: number; claims?: number[] }>;
  unsupported_claims?: number[];
  unsupported_claim_indexes: number[]; // alias for backwards compatibility
  not_claims?: number[];
  weakest_claim?: { index: number; supported: number } | null;
  answers_question?: number;
  pdf?: Record<string, any>;
  timing?: Record<string, any>;
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

export interface GuardRequestPayload {
  text: string;
  pdf?: string;
  source?: "user" | "content";
  instructions?: string;
  categories?: string[];
  threshold?: number;
  evidence?: boolean;
  return_pdf?: "highlight" | "box" | "redact";
}

export interface GuardEvidence {
  quote: string;
  start: number;
  end: number;
  confidence: number;
}

export interface GuardResult {
  model?: string;
  injection: number;
  verdict: string;
  threshold: number;
  category?: string;
  categories?: Record<string, number>;
  severity?: string;
  severities?: Record<string, number>;
  severity_expected?: number;
  evidence: GuardEvidence[];
  source?: string;
  raw_response: any;
}

export interface InspectRequestPayload {
  script: string;
  pdf?: string;
  instructions?: string;
  categories?: string[] | null;
  threshold?: number;
  evidence?: boolean;
  rotations?: number | null;
}

export interface InspectEvidence {
  line: string;
  start: number;
  end: number;
  confidence: number;
}

export interface InspectResult {
  model?: string;
  malicious?: number;
  suspicious?: number;
  verdict: string;
  threshold: number;
  category?: string;
  categories?: Record<string, number>;
  severity?: string;
  severities?: Record<string, number>;
  severity_expected?: number;
  evidence: InspectEvidence[];
  instructions_used?: string;
  pdf?: Record<string, any>;
  timing?: Record<string, any>;
  raw_response: any;
}

// --- Adapters ---

export const clockedAdapters = {
  // 1. PROTECT: POST /clocked/pii
  protect: {
    endpoint: "/pii",
    toRequest(text: string, options?: ProtectOptions) {
      return {
        text,
        entities: options?.entities || {
          person: "Full names of people or students",
          student_id: "Student matriculation numbers or IDs (e.g. CS/2024/019 or MAT-102)",
          email: "Email addresses",
        },
        anonymize: options?.anonymize || "replace",
        threshold: options?.threshold ?? 0.5,
        ...(options?.mask_keep !== undefined ? { mask_keep: options.mask_keep } : {}),
        ...(options?.max_items !== undefined ? { max_items: options.max_items } : {}),
        ...(options?.allow ? { allow: options.allow } : {}),
        ...(options?.deny ? { deny: options.deny } : {}),
        ...(options?.instructions ? { instructions: options.instructions } : {}),
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
        source: e.source ? String(e.source) : undefined,
      }));

      const counts: Record<string, number> = data?.counts || {};

      return {
        masked_text,
        entities,
        counts,
        entities_masked_count: entities.length,
        raw_response: data,
      };
    },
  },

  // 2. COMPARE: POST /clocked/compare
  compare: {
    endpoint: "/compare",
    toRequest(
      docAOrPayload: { id?: string; text?: string } | CompareRequestPayload,
      docB?: { id?: string; text?: string },
      options?: CompareOptions
    ) {
      if ("documents" in docAOrPayload && Array.isArray(docAOrPayload.documents)) {
        return {
          threshold: 0.5,
          evidence: "flagged",
          kinds: true,
          ...docAOrPayload,
        };
      }

      const docA = docAOrPayload as { id: string; text: string };
      const docBVal = docB || { id: "doc-b", text: "" };

      return {
        documents: [
          { id: docA.id, text: docA.text },
          { id: docBVal.id, text: docBVal.text },
        ],
        threshold: options?.threshold ?? 0.5,
        evidence: options?.evidence ?? "flagged",
        kinds: options?.kinds ?? true,
        ...(options?.instructions ? { instructions: options.instructions } : {}),
        ...(options?.rotations !== undefined ? { rotations: options.rotations } : {}),
        ...(options?.debug !== undefined ? { debug: options.debug } : {}),
        ...(options?.return_pdf ? { return_pdf: options.return_pdf } : {}),
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

      function parseFinding(item: any): CompareFinding {
        return {
          kind: item?.kind ? String(item.kind) : undefined,
          kinds: item?.kinds,
          confidence: item?.confidence !== undefined ? Number(item.confidence) : undefined,
          a: {
            document: String(item?.a?.document || pair?.a || ""),
            quote: String(item?.a?.quote ?? ""),
            start: Number(item?.a?.start ?? 0),
            end: Number(item?.a?.end ?? 0),
            confidence: item?.a?.confidence !== undefined ? Number(item.a.confidence) : undefined,
          },
          b: {
            document: String(item?.b?.document || pair?.b || ""),
            quote: String(item?.b?.quote ?? ""),
            start: Number(item?.b?.start ?? 0),
            end: Number(item?.b?.end ?? 0),
            confidence: item?.b?.confidence !== undefined ? Number(item.b.confidence) : undefined,
          },
        };
      }

      const duplicates: CompareFinding[] = [];
      if (Array.isArray(pair?.duplicates)) {
        for (const item of pair.duplicates) {
          const parsed = parseFinding(item);
          duplicates.push(parsed);
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

      const conflicts: CompareFinding[] = [];
      if (Array.isArray(pair?.conflicts)) {
        for (const item of pair.conflicts) {
          const parsed = parseFinding(item);
          conflicts.push(parsed);
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

      const findings = [...duplicates, ...conflicts];

      const pairs: ComparePairResult[] = Array.isArray(data?.pairs)
        ? data.pairs.map((p: any) => ({
            a: String(p?.a || ""),
            b: String(p?.b || ""),
            relation: String(p?.relation || "unrelated"),
            related: p?.related !== undefined ? Number(p.related) : undefined,
            probabilities: p?.probabilities,
            duplicates: Array.isArray(p?.duplicates) ? p.duplicates.map(parseFinding) : undefined,
            conflicts: Array.isArray(p?.conflicts) ? p.conflicts.map(parseFinding) : undefined,
          }))
        : [];

      return {
        model: data?.model,
        verdict: data?.verdict,
        relation,
        official_relation: String(pair?.relation || rawRel),
        probability,
        related: pair?.related !== undefined ? Number(pair.related) : undefined,
        probabilities: pair?.probabilities,
        passages_a,
        passages_b,
        findings,
        duplicates,
        conflicts,
        pairs,
        documents: data?.documents,
        duplicates_indexes: data?.duplicates,
        overlaps_indexes: data?.overlaps,
        conflicts_indexes: data?.conflicts,
        related_pairs_indexes: data?.related_pairs,
        instructions_used: data?.instructions_used,
        stages: data?.stages,
        pdf: data?.pdf,
        timing: data?.timing,
        raw_response: data,
      };
    },
  },

  // 3. VERIFY: POST /clocked/grounding
  verify: {
    endpoint: "/grounding",
    toRequest(
      answerOrPayload: string | VerifyRequestPayload,
      sources?: Array<string | { id: string; text: string }>,
      claimsOrOptions?: string[] | VerifyOptions,
      maybeOptions?: VerifyOptions
    ) {
      if (typeof answerOrPayload === "object") {
        return {
          threshold: 0.5,
          evidence: "flagged",
          rotations: 3,
          ...answerOrPayload,
        };
      }

      const answer = answerOrPayload;
      const claims = Array.isArray(claimsOrOptions) ? claimsOrOptions : undefined;
      const opts = (Array.isArray(claimsOrOptions) ? maybeOptions : claimsOrOptions) || {};

      const documents = sources?.map((s) => (typeof s === "string" ? s : { id: s.id, text: s.text })) || [];

      return {
        ...(opts.pdf ? { pdf: opts.pdf } : { documents }),
        answer,
        ...(opts.question ? { question: opts.question } : {}),
        ...(claims && claims.length > 0
          ? { claims }
          : opts.claims && opts.claims.length > 0
          ? { claims: opts.claims }
          : {}),
        ...(opts.instructions ? { instructions: opts.instructions } : {}),
        threshold: opts.threshold ?? 0.5,
        evidence: opts.evidence ?? "all",
        rotations: opts.rotations ?? 3,
        ...(opts.return_pdf ? { return_pdf: opts.return_pdf } : {}),
      };
    },
    fromResponse(data: any): VerifyResult {
      const grounded = Number(data?.grounded ?? 0);
      const ungrounded = data?.ungrounded !== undefined ? Number(data.ungrounded) : undefined;
      const verdict = String(
        data?.verdict ?? (grounded >= (Number(data?.threshold ?? 0.5)) ? "supported" : "unsupported")
      );
      const threshold = Number(data?.threshold ?? 0.5);
      const unsupported_claims: number[] = Array.isArray(data?.unsupported_claims)
        ? data.unsupported_claims
        : [];
      const not_claims: number[] = Array.isArray(data?.not_claims) ? data.not_claims : [];

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
          const evRel =
            status === "supported"
              ? "supported"
              : rawVerdict.includes("contra")
              ? "contradicts"
              : "unsupported";
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
          kind: c?.kind ? String(c.kind) : undefined,
          counted: c?.counted !== undefined ? Boolean(c.counted) : undefined,
          weight: c?.weight !== undefined ? Number(c.weight) : undefined,
          supported: c?.supported !== undefined ? Number(c.supported) : undefined,
          contradicted: c?.contradicted !== undefined ? Number(c.contradicted) : undefined,
          not_stated: c?.not_stated !== undefined ? Number(c.not_stated) : undefined,
          not_a_claim: c?.not_a_claim !== undefined ? Number(c.not_a_claim) : undefined,
          status,
          verdict: String(c?.verdict ?? rawVerdict),
          evidence,
          source_id: c?.source ? String(c.source) : undefined,
          sources: c?.sources,
          confidence: Number(c?.supported ?? (status === "supported" ? 0.95 : 0.1)),
        };
      });

      return {
        model: data?.model,
        instructions_used: data?.instructions_used,
        grounded,
        grounded_score: grounded, // alias for backwards compatibility
        ungrounded,
        verdict,
        overall_verdict: verdict, // alias for backwards compatibility
        threshold,
        claims: parsedClaims,
        documents: data?.documents,
        unsupported_claims,
        unsupported_claim_indexes: unsupported_claims, // alias for backwards compatibility
        not_claims,
        weakest_claim: data?.weakest_claim,
        answers_question:
          data?.answers_question !== undefined ? Number(data.answers_question) : undefined,
        pdf: data?.pdf,
        timing: data?.timing,
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

  // 8. GUARD: POST /clocked/injection
  guard: {
    endpoint: "/injection",
    toRequest(payload: GuardRequestPayload | string, options?: Partial<GuardRequestPayload>) {
      if (typeof payload === "string") {
        return {
          text: payload,
          source: options?.source || "content",
          threshold: options?.threshold ?? 0.5,
          evidence: options?.evidence ?? true,
          ...(options?.instructions ? { instructions: options.instructions } : {}),
          ...(options?.categories ? { categories: options.categories } : {}),
        };
      }
      return {
        source: "content",
        threshold: 0.5,
        evidence: true,
        ...payload,
      };
    },
    fromResponse(data: any): GuardResult {
      const rawEvidence = Array.isArray(data?.evidence) ? data.evidence : [];
      const evidence: GuardEvidence[] = rawEvidence.map((e: any) => ({
        quote: String(e.quote || ""),
        start: Number(e.start ?? 0),
        end: Number(e.end ?? 0),
        confidence: Number(e.confidence ?? 1),
      }));

      return {
        model: data?.model,
        injection: Number(data?.injection ?? 0),
        verdict: String(data?.verdict || (Number(data?.injection ?? 0) >= 0.5 ? "injection" : "benign")),
        threshold: Number(data?.threshold ?? 0.5),
        category: data?.category ? String(data.category) : undefined,
        categories: data?.categories,
        severity: data?.severity,
        severities: data?.severities,
        severity_expected: data?.severity_expected,
        evidence,
        source: data?.source,
        raw_response: data,
      };
    },
  },

  // 9. INSPECT: POST /clocked/script
  inspect: {
    endpoint: "/script",
    toRequest(payload: InspectRequestPayload | string, options?: Partial<InspectRequestPayload>) {
      if (typeof payload === "string") {
        return {
          script: payload,
          threshold: options?.threshold ?? 0.5,
          evidence: options?.evidence ?? true,
          ...(options?.instructions ? { instructions: options.instructions } : {}),
          ...(options?.categories !== undefined ? { categories: options.categories } : {}),
          ...(options?.rotations !== undefined ? { rotations: options.rotations } : {}),
          ...(options?.pdf ? { pdf: options.pdf } : {}),
        };
      }
      return {
        threshold: 0.5,
        evidence: true,
        ...payload,
      };
    },
    fromResponse(data: any): InspectResult {
      const rawEvidence = Array.isArray(data?.evidence) ? data.evidence : [];
      const evidence: InspectEvidence[] = rawEvidence.map((e: any) => ({
        line: String(e.line || ""),
        start: Number(e.start ?? 0),
        end: Number(e.end ?? 0),
        confidence: Number(e.confidence ?? 1),
      }));

      return {
        model: data?.model,
        malicious: data?.malicious !== undefined ? Number(data.malicious) : undefined,
        suspicious: data?.suspicious !== undefined ? Number(data.suspicious) : undefined,
        verdict: String(
          data?.verdict ||
            ((Number(data?.malicious ?? 0) >= 0.5 || Number(data?.suspicious ?? 0) >= 0.5)
              ? "malicious"
              : "benign")
        ),
        threshold: Number(data?.threshold ?? 0.5),
        category: data?.category ? String(data.category) : undefined,
        categories: data?.categories,
        severity: data?.severity,
        severities: data?.severities,
        severity_expected: data?.severity_expected,
        evidence,
        instructions_used: data?.instructions_used,
        pdf: data?.pdf,
        timing: data?.timing,
        raw_response: data,
      };
    },
  },
};




