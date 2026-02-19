import { db } from "../../db";
import { oauthClientsTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID, randomBytes } from "crypto";

export class OAuthClientService {
  async listClients() {
    return await db.query.oauthClientsTable.findMany({
      orderBy: (clients, { desc }) => [desc(clients.created_at)],
    });
  }

  async createClient(data: {
    clientName: string;
    redirectUris: string[];
    scope?: string;
  }) {
    const clientId = randomUUID();
    // Generate a secure random secret
    const clientSecret = randomBytes(32).toString("hex");

    await db.insert(oauthClientsTable).values({
      client_id: clientId,
      client_secret: clientSecret,
      client_name: data.clientName,
      redirect_uris: data.redirectUris,
      scope: data.scope || "admin",
      token_endpoint_auth_method: "client_secret_post", // Simplest for now
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    });

    return { clientId, clientSecret };
  }

  async deleteClient(clientId: string) {
    await db.delete(oauthClientsTable).where(eq(oauthClientsTable.client_id, clientId));
  }

  async rotateSecret(clientId: string) {
    const newSecret = randomBytes(32).toString("hex");
    await db
      .update(oauthClientsTable)
      .set({ client_secret: newSecret, updated_at: new Date() })
      .where(eq(oauthClientsTable.client_id, clientId));

    return { clientSecret: newSecret };
  }
}

export const oauthClientService = new OAuthClientService();
