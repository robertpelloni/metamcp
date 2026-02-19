import { z } from "zod";

export const OAuthClientSchema = z.object({
  client_id: z.string(),
  client_name: z.string(),
  redirect_uris: z.array(z.string()),
  scope: z.string().nullable(),
  created_at: z.string(),
});

export const ListOAuthClientsResponseSchema = z.array(OAuthClientSchema);

export const CreateOAuthClientRequestSchema = z.object({
  clientName: z.string().min(1),
  redirectUris: z.array(z.string().url()).min(1),
  scope: z.string().optional(),
});

export const CreateOAuthClientResponseSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
});

export const DeleteOAuthClientRequestSchema = z.object({
  clientId: z.string(),
});

export const RotateSecretRequestSchema = z.object({
  clientId: z.string(),
});

export const RotateSecretResponseSchema = z.object({
  clientSecret: z.string(),
});
