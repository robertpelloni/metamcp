import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { memoryService } from "../../lib/ai/memory.service";
import { db } from "../../db";
import { memoriesTable } from "../../db/schema";
import { eq } from "drizzle-orm";

export const memoriesRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50).optional() }))
    .query(async ({ input }) => {
      return await memoryService.listMemories(input.limit);
    }),

  delete: protectedProcedure
    .input(z.object({ uuid: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(memoriesTable).where(eq(memoriesTable.uuid, input.uuid));
      return { success: true };
    }),
});
