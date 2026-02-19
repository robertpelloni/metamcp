import { z } from "zod";

export const OAuthTokensSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export type OAuthTokens = z.infer<typeof OAuthTokensSchema>;
