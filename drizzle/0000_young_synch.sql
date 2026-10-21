CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'queued' NOT NULL,
	"current_step" varchar(50) DEFAULT 'ingest' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claim_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"source_document_id" uuid NOT NULL,
	"passage_text" text NOT NULL,
	"relation" varchar(50) NOT NULL,
	"raw_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"text" text NOT NULL,
	"status" varchar(50) DEFAULT 'unsupported' NOT NULL,
	"raw_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "clocked_cache" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"endpoint" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"response" jsonb NOT NULL,
	"credits" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"finding_type" varchar(20) NOT NULL,
	"finding_id" uuid NOT NULL,
	"choice" varchar(50) NOT NULL,
	"note" text DEFAULT '',
	"decided_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"kind" varchar(20) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_text" text NOT NULL,
	"masked_text" text NOT NULL,
	"label" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pair_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"doc_a_id" uuid NOT NULL,
	"doc_b_id" uuid NOT NULL,
	"relation" varchar(50) NOT NULL,
	"probability" real DEFAULT 0 NOT NULL,
	"raw_json" jsonb
);
--> statement-breakpoint
CREATE TABLE "passages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pair_result_id" uuid NOT NULL,
	"side" varchar(10) NOT NULL,
	"document_id" uuid NOT NULL,
	"char_start" integer NOT NULL,
	"char_end" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "step_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"step" varchar(50) NOT NULL,
	"done" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"state" varchar(20) DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claim_evidence" ADD CONSTRAINT "claim_evidence_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_results" ADD CONSTRAINT "pair_results_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_results" ADD CONSTRAINT "pair_results_doc_a_id_documents_id_fk" FOREIGN KEY ("doc_a_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pair_results" ADD CONSTRAINT "pair_results_doc_b_id_documents_id_fk" FOREIGN KEY ("doc_b_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_pair_result_id_pair_results_id_fk" FOREIGN KEY ("pair_result_id") REFERENCES "public"."pair_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passages" ADD CONSTRAINT "passages_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_progress" ADD CONSTRAINT "step_progress_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;