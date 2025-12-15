ALTER TABLE "tool_call_logs" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "tool_call_logs" ADD CONSTRAINT "tool_call_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_call_logs_user_id_idx" ON "tool_call_logs" USING btree ("user_id");