# Margin — Academic Integrity Review System

> **Entry for the Clocked Build Challenge (Oct 21 – Nov 10, 2026)**  
> **Author:** Joseph John Bassey

Margin helps a university lecturer review a batch of student submissions: it masks student identifiers, compares every pair of submissions for shared or conflicting facts, checks each submission's claims against the course reading pack, and shows every finding side-by-side with its evidence so a human decides.

**Margin flags; it never issues a verdict.**  
Margin is **NOT** an internet-wide plagiarism checker. Within one class, the useful forensic questions are narrower and more actionable: which submissions overlap, which claims are unsupported by the syllabus, and where is the exact textual evidence?

---

## Architecture Overview

```
                        ┌───────────────────────────────────────────────┐
                        │              STUDENT ESSAYS                   │
                        │         (.txt / .docx manuscripts)            │
                        └───────────────────────┬───────────────────────┘
                                                │
                                                ▼
                        ┌───────────────────────────────────────────────┐
                        │             DOCUMENT INGESTION                │
                        │   • Assign anonymous labels (S-01, S-02...)   │
                        │   • Parse .txt and .docx formatting           │
                        └───────────────────────┬───────────────────────┘
                                                │
                                                ▼
 ┌──────────────────────┐       ┌───────────────────────────────────────┐
 │   CLOCKED PROTECT    │◄─────►│        STEP 1: PII MASKING            │
 │  POST /clocked/pii   │       │   • Mask names, IDs, emails           │
 └──────────────────────┘       │   • Strictly output `masked_text`     │
                                └───────────────────────┬───────────────┘
                                                        │
                                                        ▼
 ┌──────────────────────┐       ┌───────────────────────────────────────┐
 │   CLOCKED COMPARE    │◄─────►│       STEP 2: PAIRWISE ALIGNMENT      │
 │ POST /clocked/compare│       │   • Evaluate n(n-1)/2 masked pairs    │
 └──────────────────────┘       │   • Enforce MAX_PAIRS limit guard     │
                                │   • Prioritize contradictions first   │
                                └───────────────────────┬───────────────┘
                                                        │
                                                        ▼
 ┌──────────────────────┐       ┌───────────────────────────────────────┐
 │    CLOCKED VERIFY    │◄─────►│      STEP 3: GROUNDING CHECK          │
 │POST /clocked/grounding       │   • Ground claims against reading pack│
 └──────────────────────┘       │   • Categorize: supported / partial   │
                                └───────────────────────┬───────────────┘
                                                        │
                                                        ▼
 ┌──────────────────────┐       ┌───────────────────────────────────────┐
 │    CLOCKED RERANK    │◄─────►│      STEP 4: EVIDENCE RERANKING       │
 │ POST /clocked/rerank │       │   • Trigger only on unsupported/part  │
 └──────────────────────┘       │   • Retrieve most relevant citations  │
                                └───────────────────────┬───────────────┘
                                                        │
                                                        ▼
 ┌──────────────────────┐       ┌───────────────────────────────────────┐
 │    CLOCKED DECIDE    │◄─────►│      STEP 5: OPTIONAL PRIORITIZATION  │
 │ POST /clocked/decide │       │   • Answer typed review questions     │
 └──────────────────────┘       └───────────────────────┬───────────────┘
                                                        │
                                                        ▼
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │                           LECTURER REVIEW INTERFACE                          │
 │  1. Batches List: Operational diagnostics, queue volume & decision velocity  │
 │  2. New Batch: Dual dropzones, sample preloader, MAX_PAIRS guard indicator   │
 │  3. Processing View: Step-by-step runner with live polling and audit trail   │
 │  4. Overlap Review: Side-by-side manuscript reader with evidence highlights  │
 │  5. Claims Check: Evidentiary citations grounded against course reading pack │
 │  6. Decisions Summary: Audit log, stat cards, and Markdown export download   │
 └──────────────────────────────────────────────────────────────────────────────┘
```

---

## Clocked Endpoints Used

Margin consumes official Clocked API endpoints directly via standard HTTP JSON over async TypeScript, wrapped in a 4-worker concurrency pool with exponential backoff jitter and a persistent disk cache:

| Capability | Clocked Endpoint | Official Contract Input | Output / Normalization | What It Changes on Screen |
| :--- | :--- | :--- | :--- | :--- |
| **Protect** | `POST /clocked/pii` | `{ text, entities: { person, student_id, email }, anonymize: "replace" }` | `anonymized_text`, `entities[]`, `counts` | Replaces raw student names and IDs with `<PERSON>` and `<STUDENT_ID>`. Only `masked_text` is ever forwarded to subsequent steps or shown in review screens. |
| **Compare** | `POST /clocked/compare` | `{ documents: [{ id, text }, { id, text }] }` | `pairs[]`, `relation`, `duplicates[]`, `conflicts[]` | Flags pairwise relations (`conflict`, `same_facts`, `duplicate`, `overlap`) with character offset ranges (`char_start`, `char_end`) for pen-wash evidence highlighting. Contradictions are sorted to the top. |
| **Verify** | `POST /clocked/grounding` | `{ documents: [...reading_pack], answer: submission_text, question?, claims?, instructions?, threshold, evidence: "all" \| "flagged" \| "none", rotations }` | `grounded`, `ungrounded`, `verdict`, `claims[]` (kind, weight, supported, contradicted, not_stated, evidence), `unsupported_claims[]`, `weakest_claim`, `answers_question` | Verifies claims against the syllabus. Tags statements as `supported`, `partial`, or `unsupported`. Unsupported claims are prioritized for lecturer inspection. |
| **Rerank** | `POST /clocked/rerank` | `{ query: claim_text, documents: reading_passages, top_n: 5 }` | `results[]: [{ index, id, action, relevance_score }]` | For unsupported or partial claims, reranks reading pack passages to find the closest syllabus references, showing verbatim excerpts with relevance scores. |
| **Decide** | `POST /clocked/decide` | `{ state, questions: { ...typed questions (noul, choice, multiselect, score) } }` | `answers`: `{ [q]: { decision, choice, probabilities, confidence } }` | Evaluates typed classification questions over text context with calibrated probability distributions. |
| **Extract** | `POST /clocked/extract` | `{ text, fields: { name: "...", list: true, format: "..." } }` | `fields`: `{ [f]: { value, start, end, confidence, items[] } }` | Reads named values verbatim with exact zero-based Unicode character offsets (`start`, `end`) for source evidence verification. |
| **Fill** | `POST /clocked/fill` | `{ text, fields: { [name]: { type: "extract" \| "choice" \| "multiselect" \| "score" \| "yes_no" \| "generate" } } }` | `fields`: `{ [f]: { value, start, end, probabilities, expected, source } }` | Combines extracted verbatim facts, decisions, ordered scores, and explicit generation into a unified typed record. |
| **Guard** | `POST /clocked/injection` | `{ text, source: "content" \| "user", instructions, threshold, evidence: true }` | `injection`, `verdict`, `category`, `categories`, `severity`, `evidence[]` | Screens untrusted student text or retrieved content for prompt injection and instruction override attempts before assistant processing. |
| **Inspect** | `POST /clocked/script` | `{ script, instructions, threshold, evidence: true, rotations }` | `malicious`, `suspicious`, `verdict`, `category`, `categories`, `severity`, `evidence[]` | Assesses submitted or referenced scripts/code blocks for harmful behaviors (e.g. security blinding, persistence, destruction) and returns specific line evidence without executing. |

---

## Design System: Paper-Ink-Cobalt

Margin is built with pure Vanilla CSS tokens (no Tailwind or external component libraries) implementing a distinct editorial academic design:

- **Color Tokens**:
  - Paper: `#F4F1EA` (warm background)
  - Surface: `#FBFAF6` (card panels)
  - Ink: `#101426` (high-contrast text, borders, and shadows)
  - Cobalt Accent: `#2B44FF` (primary actions and indicators)
  - Pen Wash: `#C5CEFF` (evidence highlighter)
  - Selected: `#E4E8FF` (active rows)
  - Track: `#E4E1D6` (progress meters)
  - Muted: `#5A5E70` (metadata and labels)
- **Typography**:
  - Headings and body: **Inter** (clean, academic readability)
  - Badges, identifiers, and metrics: **Space Mono** (`label-mono`, `caption-mono`)
- **Physical Affordances**:
  - Hard offset drop shadows (`3px 3px 0 #101426` for buttons, `4px 4px 0 #101426` for cards).
  - Hover shifts up-left by 1px with shadow expansion; active press translates 2px down-right.
- **Evidence Highlight**:
  - Wrapped via safe HTML escaping in `<mark class="evidence-highlight">` with `box-shadow: inset 0 -0.5em 0 0 var(--wash)`.
- **Dark Ink Footer Band**:
  - Fixed at the bottom of review views, displaying a live FERPA isolation privacy audit (`"Protect · X identifiers masked before comparison"`).

---

## Privacy & Security Guarantees

1. **FERPA Student Isolation**:
   - Raw student identifiers (names, IDs, emails) are parsed only during ingestion.
   - Clocked Protect (`POST /clocked/pii`) anonymizes submissions immediately.
   - All pairwise comparison, claim grounding, and reviewer displays exclusively consume `masked_text`.
2. **Never Commit Secrets**:
   - `CLOCKED_API_KEY` is loaded from `.env` (gitignored). No API keys or tokens are ever logged.
3. **Deterministic Content-Hash Disk Cache**:
   - Caches responses under `clocked_cache/` keyed by `sha256(endpoint + ":" + canonicalJson(payload))`.
   - Keys are sorted recursively so identical payloads with different key orders hit the cache.
   - **Never-Cache-Error Policy**: Only HTTP 200 responses with non-empty payloads are cached.
4. **Rate Limiting & Worker Limiter**:
   - `p-limit` caps outbound requests to 4 concurrent workers.
   - Automatic exponential backoff with random jitter on HTTP 429 and 5xx responses.
5. **MAX_PAIRS Guard**:
   - Since $n$ submissions require $n(n-1)/2$ pairwise comparisons, `MAX_PAIRS` (default: 20) guards against accidental combinatorial credit depletion.
   - The UI displays live pair calculations and blocks batches exceeding the guard limit.

---

## Synthetic Demo Dataset

The repository includes a complete synthetic academic dataset in `sample_data/` based on a university course: **GNS102 Informatics & Formal Methods**:

- **8 Synthetic Student Submissions**:
  - `S-01` (Alice Vance) vs `S-02` (Bob Wright): **Deliberate Contradiction** on empirical convergence iterations (45 iterations vs 120 iterations) on the same Alpha benchmark suite.
  - `S-03` (Clara Oswald) vs `S-04` (David Tennant): **Same Facts / Shared Source** on ample sets and partial order reduction factor (3.4x).
  - `S-05` (Elena Rostova) vs `S-06` (Fiona Gallagher): **Near-Duplicate Phrasing** describing LTL decomposition into generalized Büchi automata.
  - `S-07`: Contains an **Unsupported Claim** stating that quantum teleportation accelerates state space verification queries.
  - `S-08`: Independent reference implementation.
- **2 Course Reading Pack Documents**:
  - `reading_pack_ch4_convergence.txt`: Chapter 4 on Bounded Model Checking and Convergence Invariants.
  - `reading_pack_ch7_complexity.txt`: Chapter 7 on State Space Explosion and Partial Order Reduction.

---

## Getting Started

### 1. Installation

```bash
git clone https://github.com/Josephjbassey/margin-review.git
cd margin-review
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Clocked credentials:

```bash
CLOCKED_API_KEY=your_clocked_api_key_here
CLOCKED_BASE_URL=https://clocked.rezolve.ai/clocked
MAX_PAIRS=20
```

*(Note: If no API key is provided, Margin automatically runs against deterministic mock fallbacks for safe local evaluation).*

### 3. Seed Demo Batch

Populate the application with the pre-analyzed GNS102 demo batch:

```bash
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Unit Tests

Execute the full automated test suite:

```bash
npm test
```

### 6. Production Build

Verify production bundle compilation:

```bash
npm run build
```

---

## Evaluation Workflow (Step-by-Step for Judges)

1. **Batches Dashboard (`/`)**:
   - Inspect the operational diagnostics (Queue Volume, Evidentiary Claims, Decision Velocity).
   - Click into the pre-seeded **"GNS102 Informatics & Formal Methods"** batch.
2. **Overlap Review (`/batches/[id]/overlap`)**:
   - Observe how pairs are ordered: **Conflicts first**.
   - Select pair **S-01 ↔ S-02** to see the highlighted contradiction on convergence iteration counts (45 vs 120).
   - Select pair **S-05 ↔ S-06** to inspect near-duplicate text with pen-wash highlights.
   - Click a decision button (`Dismiss`, `Common source`, `Flag for follow-up`) and enter an audit note. The decision is recorded instantly without page reload.
3. **Claims Check (`/batches/[id]/claims`)**:
   - Review extracted statements grounded against the syllabus.
   - Select the **Unsupported** quantum teleportation claim from S-07. Note the warning indicating that no supporting evidence exists in the reading pack.
   - Record an evaluation (`Ask student to cite` or `Flag for discussion`).
4. **Decisions Summary (`/batches/[id]/decisions`)**:
   - Review the aggregate metrics and decision log.
   - Click **"Download Report (.md)"** to download the clean, audit-ready Markdown summary of all findings and lecturer decisions.
5. **Create a New Batch (`/new`)**:
   - Click **"New batch"** in the top navigation.
   - Click **"⚡ Stage GNS102 Sample Files"** to instantly stage the sample manuscripts and reading pack files.
   - Note the real-time **MAX_PAIRS Guard** indicator showing $n$ manuscripts and calculated $n(n-1)/2$ combinations.
   - Click **"Start Analysis"** to watch the 4-step pipeline runner execute with live progress bars and automatic redirection.

---

## License

MIT License. Designed and developed by Joseph John Bassey for the Clocked Build Challenge (2026).
