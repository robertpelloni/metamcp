import { z } from "zod";

export const CatalogItemSchema = z.object({
  url: z.string().url(),
  name: z.string(),
  description: z.string(),
  categories: z.array(z.string()),
  sources: z.array(z.string()),
});

export const ListCatalogResponseSchema = z.array(CatalogItemSchema);
