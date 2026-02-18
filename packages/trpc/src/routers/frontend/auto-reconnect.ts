import {
  CancelReconnectionRequestSchema,
  CancelReconnectionResponseSchema,
  ConfigureReconnectionRequestSchema,
  ConfigureReconnectionResponseSchema,
  GetReconnectionStateRequestSchema,
  GetReconnectionStateResponseSchema,
  GetReconnectionSummaryResponseSchema,
  SetReconnectionEnabledRequestSchema,
  SetReconnectionEnabledResponseSchema,
  TriggerReconnectionRequestSchema,
  TriggerReconnectionResponseSchema,
} from "@repo/zod-types";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";

export const createAutoReconnectRouter = (implementations: {
  triggerReconnection: (
    input: z.infer<typeof TriggerReconnectionRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof TriggerReconnectionResponseSchema>>;
  cancelReconnection: (
    input: z.infer<typeof CancelReconnectionRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof CancelReconnectionResponseSchema>>;
  getState: (
    input: z.infer<typeof GetReconnectionStateRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof GetReconnectionStateResponseSchema>>;
  getSummary: (
    userId: string,
  ) => Promise<z.infer<typeof GetReconnectionSummaryResponseSchema>>;
  configure: (
    input: z.infer<typeof ConfigureReconnectionRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof ConfigureReconnectionResponseSchema>>;
  setEnabled: (
    input: z.infer<typeof SetReconnectionEnabledRequestSchema>,
    userId: string,
  ) => Promise<z.infer<typeof SetReconnectionEnabledResponseSchema>>;
}) => {
  return router({
    triggerReconnection: protectedProcedure
      .input(TriggerReconnectionRequestSchema)
      .output(TriggerReconnectionResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.triggerReconnection(input, ctx.user.id);
      }),

    cancelReconnection: protectedProcedure
      .input(CancelReconnectionRequestSchema)
      .output(CancelReconnectionResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.cancelReconnection(input, ctx.user.id);
      }),

    getState: protectedProcedure
      .input(GetReconnectionStateRequestSchema)
      .output(GetReconnectionStateResponseSchema)
      .query(async ({ input, ctx }) => {
        return await implementations.getState(input, ctx.user.id);
      }),

    getSummary: protectedProcedure
      .output(GetReconnectionSummaryResponseSchema)
      .query(async ({ ctx }) => {
        return await implementations.getSummary(ctx.user.id);
      }),

    configure: protectedProcedure
      .input(ConfigureReconnectionRequestSchema)
      .output(ConfigureReconnectionResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.configure(input, ctx.user.id);
      }),

    setEnabled: protectedProcedure
      .input(SetReconnectionEnabledRequestSchema)
      .output(SetReconnectionEnabledResponseSchema)
      .mutation(async ({ input, ctx }) => {
        return await implementations.setEnabled(input, ctx.user.id);
      }),
  });
};
