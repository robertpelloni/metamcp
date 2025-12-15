CREATE TABLE "tool_set_items" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_set_uuid" uuid NOT NULL,
	"tool_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_set_items_unique_idx" UNIQUE("tool_set_uuid","tool_name")
);
--> statement-breakpoint
CREATE TABLE "tool_sets" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_sets_name_user_idx" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "tool_set_items" ADD CONSTRAINT "tool_set_items_tool_set_uuid_tool_sets_uuid_fk" FOREIGN KEY ("tool_set_uuid") REFERENCES "public"."tool_sets"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_sets" ADD CONSTRAINT "tool_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tool_set_items_tool_set_uuid_idx" ON "tool_set_items" USING btree ("tool_set_uuid");--> statement-breakpoint
CREATE INDEX "tool_sets_user_id_idx" ON "tool_sets" USING btree ("user_id");