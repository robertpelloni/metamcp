CREATE TABLE "saved_scripts" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_scripts_name_user_idx" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "saved_scripts" ADD CONSTRAINT "saved_scripts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_scripts_user_id_idx" ON "saved_scripts" USING btree ("user_id");