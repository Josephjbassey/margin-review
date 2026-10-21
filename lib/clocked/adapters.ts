/**
 * Clocked Schema Adapters Module
 *
 * All Clocked API request/response mapping is isolated in this single file.
 * Any schema change from Clocked developer documentation only touches this module.
 */

// --- Internal Types ---

export interface ProtectResult {
  masked_text: string;
  entities_masked_count: number;
  raw_response: any;
}

export interface PassageOffset {
  char_start: number;
  char_end: number;
  text: string;
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
  confidence?: number;
  raw_evidence?: any;
}

export interface VerifyResult {
  claim: string;
  status: "supported" | "partial" | "unsupported";
  evidence: VerifyEvidence[];
  raw_response: any;
}

export interface RerankedPassage {
  index: number;
  passage_text: string;
  relevance_score: number;
  raw_item?: any;
}

export interface RerankResult {
  query: string;
  ranked_passages: RerankedPassage[];
  raw_response: any;
}

// --- Adapters ---

export const clockedAdapters = {
  // 1. PROTECT (PII Masking)
  protect: {
    toRequest(text: string) {
      return {
        text,
        options: {
          mask_pii: true,
          entities: ["PERSON", "NAME", "STUDENT_ID", "MATRICULATION_NUMBER", "EMAIL"],
        },
      };
    },
    fromResponse(data: any, originalText: string): ProtectResult {
      // Handle standard Clocked protect response shapes
      const masked_text =
        data?.masked_text ||
        data?.text ||
        data?.data?.masked_text ||
        originalText;

      const entities =
        data?.entities ||
        data?.masked_entities ||
        data?.data?.entities ||
        [];

      return {
        masked_text,
        entities_masked_count: Array.isArray(entities) ? entities.length : 0,
        raw_response: data,
      };
    },
  },

  // 2. COMPARE (Pairwise document comparison)
  compare: {
    toRequest(docA: { id: string; text: string }, docB: { id: string; text: string }) {
      return {
        document_a: { id: docA.id, text: docA.text },
        document_b: { id: docB.id, text: docB.text },
      };
    },
    fromResponse(data: any): CompareResult {
      // Map relation to canonical enum
      const rawRel = String(
        data?.relation || data?.decision || data?.comparison || "none"
      ).toLowerCase();

      let relation: CompareResult["relation"] = "none";
      if (rawRel.includes("conflict") || rawRel.includes("contradict")) {
        relation = "conflict";
      } else if (rawRel.includes("same") || rawRel.includes("shared_facts")) {
        relation = "same_facts";
      } else if (rawRel.includes("dup") || rawRel.includes("identical")) {
        relation = "duplicate";
      } else if (rawRel.includes("overlap") || rawRel.includes("partial")) {
        relation = "overlap";
      }

      const probability = Number(
        data?.probability ?? data?.confidence ?? data?.score ?? 0
      );

      // Extract passage offsets for doc A
      const passages_a: PassageOffset[] = [];
      const rawA =
        data?.passages_a ||
        data?.matches_a ||
        data?.alignments?.map((a: any) => a.passage_a) ||
        [];

      if (Array.isArray(rawA)) {
        for (const item of rawA) {
          if (item) {
            passages_a.push({
              char_start: Number(item.char_start ?? item.start ?? 0),
              char_end: Number(item.char_end ?? item.end ?? 0),
              text: String(item.text ?? item.passage ?? ""),
            });
          }
        }
      }

      // Extract passage offsets for doc B
      const passages_b: PassageOffset[] = [];
      const rawB =
        data?.passages_b ||
        data?.matches_b ||
        data?.alignments?.map((a: any) => a.passage_b) ||
        [];

      if (Array.isArray(rawB)) {
        for (const item of rawB) {
          if (item) {
            passages_b.push({
              char_start: Number(item.char_start ?? item.start ?? 0),
              char_end: Number(item.char_end ?? item.end ?? 0),
              text: String(item.text ?? item.passage ?? ""),
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

  // 3. VERIFY (Grounding claims against reading pack)
  verify: {
    toRequest(claims: string[], sources: Array<{ id: string; text: string }>) {
      return {
        claims,
        sources: sources.map((s) => ({ id: s.id, content: s.text })),
      };
    },
    fromResponse(data: any, claimText: string): VerifyResult {
      const rawStatus = String(
        data?.status || data?.verdict || data?.grounding || "unsupported"
      ).toLowerCase();

      let status: VerifyResult["status"] = "unsupported";
      if (rawStatus.includes("support") && !rawStatus.includes("un")) {
        status = "supported";
      } else if (rawStatus.includes("part")) {
        status = "partial";
      }

      const evidenceList: VerifyEvidence[] = [];
      const rawEvidence = data?.evidence || data?.sources || data?.matches || [];

      if (Array.isArray(rawEvidence)) {
        for (const ev of rawEvidence) {
          const evRel = String(ev?.relation || ev?.status || status).toLowerCase();
          let relation: VerifyEvidence["relation"] = "supported";
          if (evRel.includes("part")) relation = "partial";
          else if (evRel.includes("unsupported")) relation = "unsupported";
          else if (evRel.includes("contra")) relation = "contradicts";

          evidenceList.push({
            source_id: String(ev.source_id || ev.id || "R-01"),
            passage_text: String(ev.passage || ev.text || ev.passage_text || ""),
            relation,
            confidence: Number(ev.confidence ?? ev.score ?? 0.8),
            raw_evidence: ev,
          });
        }
      }

      return {
        claim: claimText,
        status,
        evidence: evidenceList,
        raw_response: data,
      };
    },
  },

  // 4. RERANK (Passage reranking for unsupported/partial claims)
  rerank: {
    toRequest(query: string, passages: string[]) {
      return {
        query,
        passages,
      };
    },
    fromResponse(data: any, query: string): RerankResult {
      const ranked: RerankedPassage[] = [];
      const rawList = data?.results || data?.ranked_passages || data?.ranking || [];

      if (Array.isArray(rawList)) {
        for (let i = 0; i < rawList.length; i++) {
          const item = rawList[i];
          ranked.push({
            index: Number(item.index ?? i),
            passage_text: String(item.text ?? item.passage ?? ""),
            relevance_score: Number(item.relevance_score ?? item.score ?? 1 - i * 0.1),
            raw_item: item,
          });
        }
      }

      return {
        query,
        ranked_passages: ranked,
        raw_response: data,
      };
    },
  },
};
