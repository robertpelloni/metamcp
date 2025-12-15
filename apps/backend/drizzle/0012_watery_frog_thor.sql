ALTER TABLE "tools" ADD COLUMN "embedding" vector(1536);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tools_embedding_idx" ON "tools" USING hnsw ("embedding" vector_cosine_ops);
