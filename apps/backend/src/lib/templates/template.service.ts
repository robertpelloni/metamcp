import templates from "./server-templates.json";

export interface ServerTemplate {
  id: string;
  name: string;
  description: string;
  packageName: string;
  command: string;
  args: string[];
  env: Record<string, { description: string; required: boolean }>;
  matchUrlPattern: string;
}

export class TemplateService {
  private templates: ServerTemplate[] = templates as ServerTemplate[];

  getAllTemplates(): ServerTemplate[] {
    return this.templates;
  }

  getTemplateById(id: string): ServerTemplate | undefined {
    return this.templates.find((t) => t.id === id);
  }

  findTemplateForUrl(url: string): ServerTemplate | undefined {
    // Basic fuzzy matching or substring check
    return this.templates.find((t) => url.toLowerCase().includes(t.matchUrlPattern.toLowerCase()) ||
                                      url.toLowerCase().includes(t.packageName));
  }
}

export const templateService = new TemplateService();
