CREATE TABLE "rate_limits" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tool_pattern" text DEFAULT '*' NOT NULL,
	"max_requests" integer NOT NULL,
	"window_ms" integer NOT NULL,
	"user_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_unique_idx" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rate_limits_user_id_idx" ON "rate_limits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rate_limits_tool_pattern_idx" ON "rate_limits" USING btree ("tool_pattern");