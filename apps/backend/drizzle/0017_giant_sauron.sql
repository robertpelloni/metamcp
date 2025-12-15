CREATE TABLE "policies" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rules" jsonb DEFAULT '{"allow": []}'::jsonb NOT NULL,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "policies_name_user_idx" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "policies_user_id_idx" ON "policies" USING btree ("user_id");