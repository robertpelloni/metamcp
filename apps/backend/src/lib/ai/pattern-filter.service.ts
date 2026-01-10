import { Tool } from "@modelcontextprotocol/sdk/types.js";

export type PatternType = "glob" | "regex" | "text";

export interface PatternFilterOptions {
  caseSensitive?: boolean;
  matchDescription?: boolean;
  matchServer?: boolean;
}

export interface PatternMatcher {
  pattern: string;
  type: PatternType;
  test: (value: string) => boolean;
}

export interface FilterResult<T> {
  items: T[];
  matched: number;
  total: number;
  patterns: string[];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globToRegex(glob: string): string {
  let regex = "^";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    switch (char) {
      case "*":
        if (glob[i + 1] === "*") {
          regex += ".*";
          i++;
        } else {
          regex += "[^_]*";
        }
        break;
      case "?":
        regex += ".";
        break;
      case "[":
      case "]":
        regex += char;
        break;
      default:
        regex += escapeRegex(char);
    }
  }
  regex += "$";
  return regex;
}

function detectPatternType(pattern: string): PatternType {
  if (pattern.startsWith("/") && /\/[gimsuy]*$/.test(pattern)) {
    return "regex";
  }

  if (pattern.includes("*") || pattern.includes("?") || pattern.includes("[")) {
    return "glob";
  }

  return "text";
}

function createMatcher(
  pattern: string,
  options: PatternFilterOptions = {},
): PatternMatcher {
  const type = detectPatternType(pattern);
  const flags = options.caseSensitive ? "" : "i";

  let testFn: (value: string) => boolean;

  switch (type) {
    case "regex": {
      const match = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
      if (match) {
        const regexPattern = match[1];
        const regexFlags = match[2] || flags;
        const regex = new RegExp(regexPattern, regexFlags);
        testFn = (value: string) => regex.test(value);
      } else {
        testFn = () => false;
      }
      break;
    }
    case "glob": {
      const regexPattern = globToRegex(pattern);
      const regex = new RegExp(regexPattern, flags);
      testFn = (value: string) => regex.test(value);
      break;
    }
    case "text":
    default: {
      const searchPattern = options.caseSensitive
        ? pattern
        : pattern.toLowerCase();
      testFn = (value: string) => {
        const searchValue = options.caseSensitive ? value : value.toLowerCase();
        return searchValue.includes(searchPattern);
      };
      break;
    }
  }

  return { pattern, type, test: testFn };
}

export class PatternFilterService {
  filterTools(
    tools: Tool[],
    patterns: string | string[],
    options: PatternFilterOptions = {},
  ): FilterResult<Tool> {
    const patternList = Array.isArray(patterns) ? patterns : [patterns];

    if (patternList.length === 0 || patternList.every((p) => !p.trim())) {
      return {
        items: tools,
        matched: tools.length,
        total: tools.length,
        patterns: [],
      };
    }

    const matchers = patternList
      .filter((p) => p.trim())
      .map((p) => createMatcher(p.trim(), options));

    const matchedTools = tools.filter((tool) => {
      return matchers.some((matcher) => {
        if (matcher.test(tool.name)) {
          return true;
        }

        if (options.matchDescription && tool.description) {
          if (matcher.test(tool.description)) {
            return true;
          }
        }

        if (options.matchServer) {
          const serverMatch = tool.name.match(/^([^_]+)__/);
          if (serverMatch && matcher.test(serverMatch[1])) {
            return true;
          }
        }

        return false;
      });
    });

    return {
      items: matchedTools,
      matched: matchedTools.length,
      total: tools.length,
      patterns: patternList,
    };
  }

  filterByServer(tools: Tool[], serverPatterns: string | string[]): Tool[] {
    const patterns = Array.isArray(serverPatterns)
      ? serverPatterns
      : [serverPatterns];

    const matchers = patterns
      .filter((p) => p.trim())
      .map((p) => createMatcher(p.trim(), { caseSensitive: false }));

    if (matchers.length === 0) {
      return tools;
    }

    return tools.filter((tool) => {
      const serverMatch = tool.name.match(/^([^_]+)__/);
      if (!serverMatch) return false;

      const serverName = serverMatch[1];
      return matchers.some((m) => m.test(serverName));
    });
  }

  excludeTools(tools: Tool[], excludePatterns: string | string[]): Tool[] {
    const patterns = Array.isArray(excludePatterns)
      ? excludePatterns
      : [excludePatterns];

    const matchers = patterns
      .filter((p) => p.trim())
      .map((p) => createMatcher(p.trim(), { caseSensitive: false }));

    if (matchers.length === 0) {
      return tools;
    }

    return tools.filter((tool) => {
      return !matchers.some((m) => m.test(tool.name));
    });
  }

  combineFilters(
    tools: Tool[],
    config: {
      include?: string | string[];
      exclude?: string | string[];
      servers?: string | string[];
    },
  ): FilterResult<Tool> {
    let result = tools;
    const appliedPatterns: string[] = [];

    if (config.servers) {
      result = this.filterByServer(result, config.servers);
      const serverPatterns = Array.isArray(config.servers)
        ? config.servers
        : [config.servers];
      appliedPatterns.push(...serverPatterns.map((p) => `server:${p}`));
    }

    if (config.include) {
      const includeResult = this.filterTools(result, config.include, {
        matchDescription: true,
      });
      result = includeResult.items;
      appliedPatterns.push(
        ...includeResult.patterns.map((p) => `include:${p}`),
      );
    }

    if (config.exclude) {
      result = this.excludeTools(result, config.exclude);
      const excludePatterns = Array.isArray(config.exclude)
        ? config.exclude
        : [config.exclude];
      appliedPatterns.push(...excludePatterns.map((p) => `exclude:${p}`));
    }

    return {
      items: result,
      matched: result.length,
      total: tools.length,
      patterns: appliedPatterns,
    };
  }

  parsePatternQuery(query: string): {
    include: string[];
    exclude: string[];
    servers: string[];
  } {
    const include: string[] = [];
    const exclude: string[] = [];
    const servers: string[] = [];

    const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

    for (const token of tokens) {
      let cleanToken = token.replace(/^"|"$/g, "");

      if (cleanToken.startsWith("-")) {
        exclude.push(cleanToken.slice(1));
      } else if (cleanToken.startsWith("server:")) {
        servers.push(cleanToken.slice(7));
      } else if (cleanToken.startsWith("+")) {
        include.push(cleanToken.slice(1));
      } else {
        include.push(cleanToken);
      }
    }

    return { include, exclude, servers };
  }

  searchWithPattern(
    tools: Tool[],
    query: string,
    options: PatternFilterOptions = {},
  ): FilterResult<Tool> {
    const parsed = this.parsePatternQuery(query);

    return this.combineFilters(tools, {
      include: parsed.include.length > 0 ? parsed.include : undefined,
      exclude: parsed.exclude.length > 0 ? parsed.exclude : undefined,
      servers: parsed.servers.length > 0 ? parsed.servers : undefined,
    });
  }
}

export const patternFilterService = new PatternFilterService();
