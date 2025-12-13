CREATE TABLE "tool_call_logs" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"tool_name" text NOT NULL,
	"arguments" jsonb,
	"result" jsonb,
	"error" text,
	"duration_ms" text,
	"parent_call_uuid" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tool_call_logs_session_id_idx" ON "tool_call_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "tool_call_logs_parent_call_uuid_idx" ON "tool_call_logs" USING btree ("parent_call_uuid");--> statement-breakpoint
CREATE INDEX "tool_call_logs_created_at_idx" ON "tool_call_logs" USING btree ("created_at");