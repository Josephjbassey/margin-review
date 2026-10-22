# Margin — Academic Integrity Review System

> **Entry for the Clocked Build Challenge (Oct 21 – Nov 10, 2026)**  
> **Author:** Joseph John Bassey  
> **Live Architecture:** Next.js 16 (Turbopack) · Better Auth · Neon PostgreSQL · Pure Vanilla CSS

Margin helps a university lecturer review a batch of student submissions: it masks student identifiers, compares every pair of submissions for shared or conflicting facts, checks each submission's claims against the course reading pack, and shows every finding side-by-side with its evidence so a human decides.

**Margin flags; it never issues an automated verdict.**  
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
 │  1. Public Showcase (/): Interactive evidence sandbox & due process creed    │
 │  2. Batches List (/): Operational diagnostics, queue volume & velocity       │
 │  3. New Batch (/new): Dual dropzones, sample preloader, MAX_PAIRS guard      │
 │  4. Processing View (/batches/[id]/processing): Step-by-step pipeline runner │
 │  5. Overlap Review (/batches/[id]/overlap): Side-by-side manuscript reader   │
 │  6. Claims Check (/batches/[id]/claims): Evidentiary citations grounded      │
 │  7. Decisions Summary (/batches/[id]/decisions): Audit log & Markdown export │
 │  8. Pricing & Licensing (/pricing): Usage calculator & semester pack model   │
 │  9. FERPA & Privacy (/privacy): Redaction guarantee & data sovereignty       │
 └──────────────────────────────────────────────────────────────────────────────┘
```

---

## Clocked Endpoints Used

Margin consumes official Clocked API endpoints directly via standard HTTP JSON over async TypeScript, wrapped in a 4-worker concurrency pool with exponential backoff jitter and a persistent disk cache:

| Capability | Clocked Endpoint | Official Contract Input | Output / Normalization | What It Changes on Screen |
| :--- | :--- | :--- | :--- | :--- |
| **Protect** | `POST /clocked/pii` | `{ text, entities: { person, student_id, email }, anonymize: "replace" }` | `anonymized_text`, `entities[]`, `counts` | Replaces raw student names and IDs with `<PERSON>` and `<STUDENT_ID>`. Only `masked_text` is ever forwarded to subsequent steps or shown in review screens. |
| **Compare** | `POST /clocked/compare` | `{ documents: [{ id, text, pdf?, pages?, date? }], instructions?, threshold, evidence: "all" \| "flagged" \| "none", kinds: true, rotations?, debug? }` | `verdict`, `pairs[]` (relation, related, probabilities, duplicates[], conflicts[]), `documents[]`, `duplicates[]`, `overlaps[]`, `conflicts[]` | Flags pairwise relations (`conflict`, `same_facts`, `duplicate`, `overlap`) with character offset ranges (`char_start`, `char_end`) for pen-wash evidence highlighting. Contradictions are sorted to the top. |
| **Verify** | `POST /clocked/grounding` | `{ documents: [...reading_pack], answer: submission_text, question?, claims?, instructions?, threshold, evidence: "all" \| "flagged" \| "none", rotations }` | `grounded`, `ungrounded`, `verdict`, `claims[]` (kind, weight, supported, contradicted, not_stated, evidence), `unsupported_claims[]`, `weakest_claim`, `answers_question` | Verifies claims against the syllabus. Tags statements as `supported`, `partial`, or `unsupported`. Unsupported claims are prioritized for lecturer inspection. |
| **Rerank** | `POST /clocked/rerank` | `{ query, documents: [{ id?, text, title?, metadata? }], context?, conversation?, instructions?, top_n?, questions?, calibration_temperature? }` | `results[]: [{ index, id, action: "use" \| "expand" \| "skip", reason?, relevance_score, document_score, levels }]`, `answers?`, `usage` | For unsupported or partial claims, ranks syllabus passages independently and signals whether to use the excerpt, expand the surrounding context, or skip with specific reasons. |
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
  - Icons: **Material Symbols Outlined** (locally bundled font with ligature rendering)
- **Physical Affordances**:
  - Hard offset drop shadows (`3px 3px 0 #101426` for buttons, `4px 4px 0 #101426` for cards).
  - Hover shifts up-left by 1px with shadow expansion; active press translates 2px down-right.
- **Evidence Highlight**:
  - Wrapped via safe HTML escaping in `<mark class="evidence-highlight">` with `box-shadow: inset 0 -0.5em 0 0 var(--wash)`.
- **Top Navigation Bar**:
  - Route-aware active indicators (`usePathname()`).
  - Distinct views for authenticated reviewers vs. public visitors.
  - Interactive, editable institution / department affiliation with `localStorage` persistence.
  - Instant **"⚖️ Judge Access"** 1-click evaluation button for hackathon judges.

---

## Academic Pricing & Inference Economics (`/pricing`)

Margin's pricing is grounded directly in Clocked's published sub-second inference metrics (where 1 credit covers up to 25ms of active model time):

- **Inference Reality**: Reviewing a typical 1,500-word student essay against syllabus reading packs consumes ~40 to 60 compute credits. Initial n-gram shingling is computed locally in memory at **zero API cost**.
- **Tier Structure**:
  1. **Course Pilot ($0)**: 4,000 compute credits one-time for single class evaluation (up to 20 paper comparisons).
  2. **Instructor Plan ($29/mo or $26.10/mo yearly)**: 120,000 credits/mo ($0.24 per 1k overage), covers ~2,400 student paper comparisons.
  3. **Department License ($249/mo or $224.10/mo yearly)**: 1,250,000 credits/mo ($0.20 per 1k overage), covers ~25,000 paper comparisons with multi-TA shared workspace.
  4. **Campus & Registrar ($999/mo or $899.10/mo yearly)**: 6,500,000 credits/mo ($0.15 per 1k overage), covers ~130,000 comparisons with Canvas/Blackboard LTI 1.3 and InCommon SAML SSO.
- **Annual Discount**: 10% off subscription price + 10% bonus credit pool.
- **Transparent Reset Disclosure**: Included subscription credits reset monthly per Clocked billing rules.
- **Flexible Procurement Models**:
  - **Direct Institutional Connect (BYOK)**: University connects its verified AI account with 0% platform surcharge.
  - **All-in-One Semester Packs**: Fixed $49 / 250 paper reviews approved for university P-cards and grant receipts.

---

## Privacy & Security Guarantees (`/privacy`)

1. **FERPA Student Isolation**:
   - Raw student identifiers (names, IDs, emails) are parsed only during ingestion.
   - Automated PII masking strips identifiers immediately; downstream comparison and reviewer screens strictly consume `masked_text`.
2. **Intra-Cohort Boundary**:
   - Submissions are evaluated solely within their assigned course cohort. Student essays are never pooled into public corpora and never used to train external models.
3. **Never Commit Secrets**:
   - `CLOCKED_API_KEY` is loaded from `.env` (gitignored). No API keys or tokens are ever logged.
4. **Deterministic Content-Hash Disk Cache**:
   - Caches responses under `clocked_cache/` keyed by `sha256(endpoint + ":" + canonicalJson(payload))`.
   - Keys are sorted recursively so identical payloads with different key orders hit the cache.
   - **Never-Cache-Error Policy**: Only HTTP 200 responses with non-empty payloads are cached.
5. **Rate Limiting & Worker Limiter**:
   - `p-limit` caps outbound requests to 4 concurrent workers.
   - Automatic exponential backoff with random jitter on HTTP 429 and 5xx responses.
6. **MAX_PAIRS Guard**:
   - Since $n$ submissions require $n(n-1)/2$ pairwise comparisons, `MAX_PAIRS` (default: 20) guards against accidental combinatorial credit depletion.
   - The UI displays live pair calculations and blocks batches exceeding the guard limit.
7. **Authentication & Judge Mode**:
   - Production authentication powered by **Better Auth** with **Neon PostgreSQL** (`user`, `session`, `account`, `verification` tables via Drizzle ORM).
   - Supports academic lecturer registration and email/password sign-in.
   - **1-Click Judge Mode** (`POST /api/auth/judge-login`): provides instant access for Clocked Build Challenge judges without requiring email confirmations or password creation.
   - Offline & test fallback: runs seamlessly in-memory when `DATABASE_URL` is unset, keeping local development and automated CI tests fast.

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

Execute the full automated test suite (34 passing tests across 6 suites):

```bash
npm test
```

### 6. Production Build

Verify production bundle compilation with Turbopack:

```bash
npm run build
```

---

## Evaluation Workflow (Step-by-Step for Judges)

1. **Public Landing Page & 1-Click Judge Access (`/`)**:
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
   - Explore the public landing page: interactive live evidence trial sandbox, Academic Due Process manifesto, and operational criteria comparison table.
   - Click the topbar button: **"⚖️ Judge Access"** (or click **"Launch Free Judge Trial →"** in the hero). This instantly provisions an authenticated evaluation session without requiring signup.
2. **Batches Dashboard (`/`)**:
   - Inspect the operational diagnostics (Queue Volume, Evidentiary Claims, Decision Velocity).
   - Click into the pre-seeded **"GNS102 Informatics & Formal Methods"** batch.
3. **Overlap Review (`/batches/[id]/overlap`)**:
   - Observe how pairs are ordered: **Conflicts first**.
   - Select pair **S-01 ↔ S-02** to see the highlighted contradiction on convergence iteration counts (45 vs 120).
   - Select pair **S-05 ↔ S-06** to inspect near-duplicate text with pen-wash highlights.
   - Click a decision button (`Dismiss`, `Common source`, `Flag for follow-up`) and enter an audit note. The decision is recorded instantly without page reload.
4. **Claims Check (`/batches/[id]/claims`)**:
   - Review extracted statements grounded against the syllabus.
   - Select the **Unsupported** quantum teleportation claim from S-07. Note the warning indicating that no supporting evidence exists in the reading pack.
   - Record an evaluation (`Ask student to cite` or `Flag for discussion`).
5. **Decisions Summary (`/batches/[id]/decisions`)**:
   - Review the aggregate metrics and decision log.
   - Click **"Download Report (.md)"** to download the clean, audit-ready Markdown summary of all findings and lecturer decisions.
6. **Create a New Batch (`/new`)**:
   - Click **"New batch"** in the top navigation.
   - Click **"⚡ Stage GNS102 Sample Files"** to instantly stage the sample manuscripts and reading pack files.
   - Note the real-time **MAX_PAIRS Guard** indicator showing $n$ manuscripts and calculated $n(n-1)/2$ combinations.
   - Click **"Start Analysis"** to watch the 4-step pipeline runner execute with live progress bars and automatic redirection.
7. **Pricing & Department Economics (`/pricing`)**:
   - Test the interactive Course Cohort Credit Estimator slider.
   - Toggle between Monthly and Yearly billing to see the 10% discount and credit pool expansion.
8. **FERPA & Privacy Documentation (`/privacy`)**:
   - Review the formal student record isolation policy and intra-cohort security ledger.

---

## Known Limits & Considerations

1. **Intra-Batch Forensic Scope (Not Internet Plagiarism Search)**:
   - Margin is deliberately designed to review submission cohorts against each other and against the assigned course reading pack. It does not scan external internet web pages or proprietary essay mills.
2. **Combinatorial Pair Budgeting (`MAX_PAIRS`)**:
   - Evaluating all pairs requires $O(n^2)$ comparisons ($n(n-1)/2$). While this is ideal for seminar-sized cohorts (10–20 students), large lecture halls (e.g. 200+ students) should be split into seminar sections or prioritized using pre-clustering filters to preserve API credits and avoid reviewer fatigue.
3. **Serving Token Budget on Grounding Sources**:
   - The Verify endpoint operates within Clocked's source context admission limit (up to 20 documents, 200,000 characters). Syllabi exceeding this budget should be pre-chunked or selectively assigned per module.
4. **Human In The Loop Requirement**:
   - Margin never issues automated penalties, grades, or disciplinary verdicts. Every flagged contradiction, near-duplicate phrase, or ungrounded statement requires a human lecturer to confirm context and render a decision.

---

## License

MIT License. Designed and developed by Joseph John Bassey for the Clocked Build Challenge (2026).
