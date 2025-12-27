import { db } from "../../db";
import { toolsTable } from "../../db/schema";
import { toolTypeGeneratorService } from "../../lib/ai/tool-type-generator.service";

export class ToolTypeGeneratorService {
  async generateTypes(): Promise<string> {
    const tools = await db.select().from(toolsTable);

    // Convert tools to TS definitions
    // This is a simplified version. A robust version would parse JSON Schema.

    const toolDefs = tools.map(tool => {
      // Basic type mapping (JSON Schema -> TS)
      // This is complex. For now, we generate a generic signature or use 'any'.
      // Enhancing this would require a JSON Schema to TS converter.

      const argsSchema = tool.input_schema as any;
      let argsType = "any";

      // Simple heuristic for common schemas
      if (argsSchema?.type === "object" && argsSchema?.properties) {
          argsType = "{ " + Object.keys(argsSchema.properties).map(k => {
              const prop = argsSchema.properties[k];
              const optional = argsSchema.required?.includes(k) ? "" : "?";
              let type = "any";
              if (prop.type === "string") type = "string";
              if (prop.type === "number") type = "number";
              if (prop.type === "boolean") type = "boolean";
              return `${k}${optional}: ${type}`;
          }).join(", ") + " }";
      }

      return `
      /**
       * ${tool.description || ""}
       */
      call(tool: "${tool.name}", args: ${argsType}): Promise<any>;`;
    });

    const metaTools = `
      /** Search for tools */
      call(tool: "search_tools", args: { query: string, limit?: number }): Promise<any>;
      /** Load a tool */
      call(tool: "load_tool", args: { name: string }): Promise<any>;
      /** Run code */
      call(tool: "run_code", args: { code: string }): Promise<any>;
      /** Run agent */
      call(tool: "run_agent", args: { task: string, policyId?: string }): Promise<any>;
      /** Save script */
      call(tool: "save_script", args: { name: string, code: string, description?: string }): Promise<any>;
    `;

    return `
    declare const mcp: {
        ${metaTools}
        ${toolDefs.join("\n")}
        call(tool: string, args: any): Promise<any>;
    };
    `;
  }
}

export const toolTypeGeneratorService = new ToolTypeGeneratorService();
