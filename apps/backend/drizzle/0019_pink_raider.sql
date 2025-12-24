CREATE TABLE "scheduled_tasks" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cron" text NOT NULL,
	"task_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"user_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_run" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scheduled_tasks" ADD CONSTRAINT "scheduled_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_tasks_user_id_idx" ON "scheduled_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "scheduled_tasks_is_active_idx" ON "scheduled_tasks" USING btree ("is_active");