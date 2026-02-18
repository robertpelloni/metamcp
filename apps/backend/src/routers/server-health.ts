import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const serverHealthRouter = router({
    getHealth: publicProcedure.query(async () => {
        return {
            status: "healthy",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }),
});
