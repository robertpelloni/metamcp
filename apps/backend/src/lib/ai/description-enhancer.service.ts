import OpenAI from "openai";

import { db } from "../../db";
import { toolsTable } from "../../db/schema";
import { sql } from "drizzle-orm";

export class DescriptionEnhancerService {
  private openai: OpenAI | null = null;
  private model = "gpt-4o-mini"; // Use a fast/cheap model for this

  private getClient(): OpenAI | null {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn("OPENAI_API_KEY not set, skipping description enhancement");
        return null;
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  /**
   * Generates a rich description (for search) and a concise description (for context)
   * using an LLM.
   */
  async enhanceToolDescription(tool: {
    uuid: string;
    name: string;
    description: string | null;
    toolSchema: any;
  }): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    try {
      const schemaStr = JSON.stringify(tool.toolSchema, null, 2);
      const prompt = `
        You are an expert AI tool optimizer.
        Analyze the following tool definition:
        Name: ${tool.name}
        Original Description: ${tool.description || "None"}
        Schema: ${schemaStr}

        Task:
        1. Create a "Rich Description" that details every capability, parameter nuance, and use case. This will be used for semantic search embeddings.
        2. Create a "Concise Description" that is extremely brief (under 15 words) but captures the core purpose. This will be used in the LLM context window to save tokens.
        3. Create a "Synthetic User Query" that represents what a user might ask to trigger this tool.

        Return JSON format:
        {
          "rich": "...",
          "concise": "...",
          "syntheticQuery": "..."
        }
      `;

      const response = await client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) return;

      const result = JSON.parse(content);
      const { rich, concise, syntheticQuery } = result;

      // Combine rich description and synthetic query for better retrieval
      const finalRichDescription = `${rich}\n\nSynthetic User Query: ${syntheticQuery}`;

      // Update database
      await db
        .update(toolsTable)
        .set({
          rich_description: finalRichDescription,
          concise_description: concise,
        })
        .where(sql`${toolsTable.uuid} = ${tool.uuid}`);

      console.log(`Enhanced description for tool: ${tool.name}`);

    } catch (error) {
      console.error(`Error enhancing description for ${tool.name}:`, error);
    }
  }
}

export const descriptionEnhancerService = new DescriptionEnhancerService();
