import OpenAI from "openai";

export class EmbeddingService {
  private openai: OpenAI | null = null;
  private model = "text-embedding-3-small";

  private getClient(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set. Please configure it in .env to use Semantic Search.");
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const client = this.getClient();
      const response = await client.embeddings.create({
        model: this.model,
        input: text.replace(/\n/g, " "),
        dimensions: 1536,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      // Fallback or rethrow depending on strictness requirements
      throw error;
    }
  }

  /**
   * Generates a rich text description for a tool to be embedded.
   * This combines name, description, and potentially schema details.
   */
  generateToolSearchText(tool: {
    name: string;
    description?: string | null;
    toolSchema: any;
  }): string {
    const parts = [
      `Tool Name: ${tool.name}`,
      `Description: ${tool.description || "No description provided"}`,
    ];

    // Optionally add schema keys to help with parameter-based search
    // We avoid adding the full schema to keep the embedding focused on intent
    if (tool.toolSchema && tool.toolSchema.properties) {
      const keys = Object.keys(tool.toolSchema.properties).join(", ");
      parts.push(`Parameters: ${keys}`);
    }

    return parts.join("\n");
  }
}

export const embeddingService = new EmbeddingService();
