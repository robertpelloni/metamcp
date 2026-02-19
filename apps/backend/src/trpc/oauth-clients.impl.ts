import { AppRouter } from "@repo/trpc";
import { oauthClientService } from "../lib/oauth/client.service";

export const oauthClientsImplementations: AppRouter["frontend"]["oauthClients"] = {
  list: async () => {
    const clients = await oauthClientService.listClients();
    return clients.map(c => ({
      client_id: c.client_id,
      client_name: c.client_name,
      redirect_uris: c.redirect_uris,
      scope: c.scope,
      created_at: c.created_at.toISOString(),
    }));
  },
  create: async ({ input }) => {
    return await oauthClientService.createClient(input);
  },
  delete: async ({ input }) => {
    await oauthClientService.deleteClient(input.clientId);
  },
  rotateSecret: async ({ input }) => {
    return await oauthClientService.rotateSecret(input.clientId);
  },
};
