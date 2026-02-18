CREATE TABLE "llm_usage_logs" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model" text NOT NULL,
	"context" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"user_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "llm_usage_logs" ADD CONSTRAINT "llm_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "llm_usage_logs_user_id_idx" ON "llm_usage_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "llm_usage_logs_context_idx" ON "llm_usage_logs" USING btree ("context");--> statement-breakpoint
CREATE INDEX "llm_usage_logs_model_idx" ON "llm_usage_logs" USING btree ("model");--> statement-breakpoint
CREATE INDEX "llm_usage_logs_created_at_idx" ON "llm_usage_logs" USING btree ("created_at");