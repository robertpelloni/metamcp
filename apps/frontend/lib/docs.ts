import fs from "fs";
import path from "path";
import matter from "gray-matter";

// In production (Docker), cwd is /app/apps/frontend, docs are at /app/docs -> ../../docs
// In local dev (monorepo), cwd is apps/frontend, docs are at ../../docs
const DOCS_PATH = path.resolve(process.cwd(), "../../docs");

export interface Doc {
  slug: string[];
  title: string;
  description: string;
  content: string;
  frontmatter: Record<string, any>;
}

export function getDoc(slug: string[]): Doc | null {
  try {
    // If slug is empty, default to index? but slug is string[]
    const slugPath = slug.join("/");

    // Try .mdx then .md
    let fullPath = path.join(DOCS_PATH, `${slugPath}.mdx`);
    if (!fs.existsSync(fullPath)) {
        fullPath = path.join(DOCS_PATH, `${slugPath}.md`);
    }

    // Special case for folder/index
    if (!fs.existsSync(fullPath)) {
        fullPath = path.join(DOCS_PATH, slugPath, "index.mdx");
        if (!fs.existsSync(fullPath)) {
             fullPath = path.join(DOCS_PATH, slugPath, "index.md");
        }
    }

    if (!fs.existsSync(fullPath)) {
      console.warn(`Doc not found: ${fullPath}`);
      return null;
    }

    const fileContent = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      slug,
      title: data.title || slug[slug.length - 1],
      description: data.description || "",
      content,
      frontmatter: data,
    };
  } catch (error) {
    console.error("Error reading doc:", error);
    return null;
  }
}

export function getDocsNavigation() {
    try {
        const docsJsonPath = path.join(DOCS_PATH, "docs.json");
        if (!fs.existsSync(docsJsonPath)) return null;
        const content = fs.readFileSync(docsJsonPath, "utf-8");
        return JSON.parse(content);
    } catch (e) {
        console.error("Error reading docs.json", e);
        return null;
    }
}
