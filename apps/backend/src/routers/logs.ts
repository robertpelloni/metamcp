import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const logsRouter = router({
    get: publicProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(100).default(50),
                cursor: z.number().nullish(),
            }),
        )
        .query(async ({ input }) => {
            const { limit, cursor } = input;
            const offset = cursor ?? 0;

            // TODO: Replace with real database query when logs table is ready
            const logs = [
                {
                    id: "1",
                    level: "info",
                    message: "System started",
                    timestamp: new Date().toISOString(),
                },
            ];

            return {
                items: logs,
                nextCursor: null,
            };
        }),
});
