import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).notNull().default("queued"), // queued, running, done, error
  current_step: varchar("current_step", { length: 50 }).notNull().default("ingest"),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 20 }).notNull(), // 'submission' | 'reading'
  filename: varchar("filename", { length: 255 }).notNull(),
  original_text: text("original_text").notNull(),
  masked_text: text("masked_text").notNull(),
  label: varchar("label", { length: 50 }).notNull(), // S-01, S-02, R-01, etc.
});

export const pairResults = pgTable("pair_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  doc_a_id: uuid("doc_a_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  doc_b_id: uuid("doc_b_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  relation: varchar("relation", { length: 50 }).notNull(), // 'conflict' | 'same_facts' | 'duplicate' | 'overlap' | 'none'
  probability: real("probability").notNull().default(0),
  raw_json: jsonb("raw_json"),
});

export const passages = pgTable("passages", {
  id: uuid("id").primaryKey().defaultRandom(),
  pair_result_id: uuid("pair_result_id")
    .notNull()
    .references(() => pairResults.id, { onDelete: "cascade" }),
  side: varchar("side", { length: 10 }).notNull(), // 'a' | 'b'
  document_id: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  char_start: integer("char_start").notNull(),
  char_end: integer("char_end").notNull(),
  text: text("text").notNull(),
});

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  document_id: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("unsupported"), // 'supported' | 'partial' | 'unsupported'
  raw_json: jsonb("raw_json"),
});

export const claimEvidence = pgTable("claim_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  claim_id: uuid("claim_id")
    .notNull()
    .references(() => claims.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  source_document_id: uuid("source_document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  passage_text: text("passage_text").notNull(),
  relation: varchar("relation", { length: 50 }).notNull(), // 'supported' | 'partial' | 'unsupported' | 'contradicts'
  raw_json: jsonb("raw_json"),
});

export const decisions = pgTable("decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  finding_type: varchar("finding_type", { length: 20 }).notNull(), // 'pair' | 'claim'
  finding_id: uuid("finding_id").notNull(),
  choice: varchar("choice", { length: 50 }).notNull(), // 'dismiss' | 'common_source' | 'flag' | 'accept' | 'cite'
  note: text("note").default(""),
  decided_at: timestamp("decided_at").defaultNow().notNull(),
});

export const stepProgress = pgTable("step_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  batch_id: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  step: varchar("step", { length: 50 }).notNull(), // 'ingest' | 'protect' | 'compare' | 'verify' | 'rerank'
  done: integer("done").notNull().default(0),
  total: integer("total").notNull().default(0),
  state: varchar("state", { length: 20 }).notNull().default("pending"), // 'pending' | 'running' | 'done' | 'error'
});

export const clockedCache = pgTable("clocked_cache", {
  key: varchar("key", { length: 64 }).primaryKey(), // sha256
  endpoint: varchar("endpoint", { length: 50 }).notNull(),
  payload: jsonb("payload").notNull(),
  response: jsonb("response").notNull(),
  credits: integer("credits").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const batchesRelations = relations(batches, ({ many }) => ({
  documents: many(documents),
  pairResults: many(pairResults),
  decisions: many(decisions),
  stepProgress: many(stepProgress),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  batch: one(batches, {
    fields: [documents.batch_id],
    references: [batches.id],
  }),
  claims: many(claims),
}));

export const pairResultsRelations = relations(pairResults, ({ one, many }) => ({
  batch: one(batches, {
    fields: [pairResults.batch_id],
    references: [batches.id],
  }),
  docA: one(documents, {
    fields: [pairResults.doc_a_id],
    references: [documents.id],
  }),
  docB: one(documents, {
    fields: [pairResults.doc_b_id],
    references: [documents.id],
  }),
  passages: many(passages),
}));

export const passagesRelations = relations(passages, ({ one }) => ({
  pairResult: one(pairResults, {
    fields: [passages.pair_result_id],
    references: [pairResults.id],
  }),
  document: one(documents, {
    fields: [passages.document_id],
    references: [documents.id],
  }),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  document: one(documents, {
    fields: [claims.document_id],
    references: [documents.id],
  }),
  evidence: many(claimEvidence),
}));

export const claimEvidenceRelations = relations(claimEvidence, ({ one }) => ({
  claim: one(claims, {
    fields: [claimEvidence.claim_id],
    references: [claims.id],
  }),
  sourceDocument: one(documents, {
    fields: [claimEvidence.source_document_id],
    references: [documents.id],
  }),
}));

// --- Better Auth Schema for Neon PostgreSQL ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  role: text("role").default("lecturer"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

