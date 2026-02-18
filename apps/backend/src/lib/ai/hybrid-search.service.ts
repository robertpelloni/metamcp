import { cosineDistance, desc, gt, sql, or, ilike } from "drizzle-orm";

import { db } from "../../db";
import { toolsTable } from "../../db/schema";
import { embeddingService } from "./embedding.service";

/**
 * Hybrid Search using Reciprocal Rank Fusion (RRF).
 * RRF formula: RRF(d) = Σ 1/(k + rank_i(d)) where k=60 (standard constant)
 */

export interface HybridSearchResult {
  uuid: string;
  name: string;
  description: string | null;
  mcpServerUuid: string;
  keywordScore: number;
  semanticScore: number;
  hybridScore: number;
  keywordRank: number | null;
  semanticRank: number | null;
}

export interface HybridSearchOptions {
  limit?: number;
  semanticThreshold?: number;
  rrfK?: number;
  keywordOnly?: boolean;
  semanticOnly?: boolean;
}

interface ToolData {
  uuid: string;
  name: string;
  description: string | null;
  mcpServerUuid: string;
}

interface RankedResult {
  rank: number;
  score: number;
  data: ToolData;
}

const DEFAULT_OPTIONS: Required<HybridSearchOptions> = {
  limit: 10,
  semanticThreshold: 0.3,
  rrfK: 60,
  keywordOnly: false,
  semanticOnly: false,
};

export class HybridSearchService {
  async search(
    query: string,
    options: HybridSearchOptions = {},
  ): Promise<HybridSearchResult[]> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    if (!query.trim()) {
      return [];
    }

    if (opts.keywordOnly) {
      return this.keywordSearchOnly(query, opts.limit);
    }

    if (opts.semanticOnly) {
      return this.semanticSearchOnly(query, opts.limit, opts.semanticThreshold);
    }

    const [keywordResults, semanticResults] = await Promise.all([
      this.runKeywordSearch(query, opts.limit * 2),
      this.runSemanticSearch(query, opts.limit * 2, opts.semanticThreshold),
    ]);

    const fusedResults = this.reciprocalRankFusion(
      keywordResults,
      semanticResults,
      opts.rrfK,
    );

    return fusedResults.slice(0, opts.limit);
  }

  private async runKeywordSearch(
    query: string,
    limit: number,
  ): Promise<Map<string, RankedResult>> {
    const results = new Map<string, RankedResult>();

    try {
      const terms = query
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 1);

      if (terms.length === 0) {
        return results;
      }

      const conditions = terms.flatMap((term) => [
        ilike(toolsTable.name, `%${term}%`),
        ilike(toolsTable.description, `%${term}%`),
        ilike(toolsTable.concise_description, `%${term}%`),
      ]);

      const queryLower = query.toLowerCase();
      const matchScore = sql<number>`(
        CASE WHEN LOWER(${toolsTable.name}) = ${queryLower} THEN 100 ELSE 0 END +
        CASE WHEN LOWER(${toolsTable.name}) LIKE ${`%${queryLower}%`} THEN 50 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(${toolsTable.description}, '')) LIKE ${`%${queryLower}%`} THEN 25 ELSE 0 END +
        CASE WHEN LOWER(COALESCE(${toolsTable.concise_description}, '')) LIKE ${`%${queryLower}%`} THEN 30 ELSE 0 END
      )`;

      const rows = await db
        .select({
          uuid: toolsTable.uuid,
          name: toolsTable.name,
          description: sql<string>`COALESCE(${toolsTable.concise_description}, ${toolsTable.description})`,
          mcpServerUuid: toolsTable.mcp_server_uuid,
          score: matchScore,
        })
        .from(toolsTable)
        .where(or(...conditions))
        .orderBy(desc(matchScore))
        .limit(limit);

      rows.forEach((row, index) => {
        results.set(row.uuid, {
          rank: index + 1,
          score: Number(row.score) || 0,
          data: {
            uuid: row.uuid,
            name: row.name,
            description: row.description,
            mcpServerUuid: row.mcpServerUuid,
          },
        });
      });
    } catch (error) {
      console.error("Keyword search error:", error);
    }

    return results;
  }

  private async runSemanticSearch(
    query: string,
    limit: number,
    threshold: number,
  ): Promise<Map<string, RankedResult>> {
    const results = new Map<string, RankedResult>();

    try {
      const queryEmbedding = await embeddingService.generateEmbedding(query);
      const similarity = sql<number>`1 - (${cosineDistance(
        toolsTable.embedding,
        queryEmbedding,
      )})`;

      const rows = await db
        .select({
          uuid: toolsTable.uuid,
          name: toolsTable.name,
          description: sql<string>`COALESCE(${toolsTable.concise_description}, ${toolsTable.description})`,
          mcpServerUuid: toolsTable.mcp_server_uuid,
          similarity,
        })
        .from(toolsTable)
        .where(gt(similarity, threshold))
        .orderBy(desc(similarity))
        .limit(limit);

      rows.forEach((row, index) => {
        results.set(row.uuid, {
          rank: index + 1,
          score: row.similarity,
          data: {
            uuid: row.uuid,
            name: row.name,
            description: row.description,
            mcpServerUuid: row.mcpServerUuid,
          },
        });
      });
    } catch (error) {
      console.error("Semantic search error:", error);
    }

    return results;
  }

  /**
   * RRF formula: score(d) = Σ 1/(k + rank_i(d))
   * k=60 reduces impact of high rankings, robust across different score distributions
   */
  private reciprocalRankFusion(
    keywordResults: Map<string, RankedResult>,
    semanticResults: Map<string, RankedResult>,
    k: number = 60,
  ): HybridSearchResult[] {
    const fusedScores = new Map<
      string,
      {
        rrfScore: number;
        keywordRank: number | null;
        semanticRank: number | null;
        keywordScore: number;
        semanticScore: number;
        data: ToolData;
      }
    >();

    for (const [uuid, result] of keywordResults) {
      const rrfContribution = 1 / (k + result.rank);
      fusedScores.set(uuid, {
        rrfScore: rrfContribution,
        keywordRank: result.rank,
        semanticRank: null,
        keywordScore: result.score,
        semanticScore: 0,
        data: result.data,
      });
    }

    for (const [uuid, result] of semanticResults) {
      const rrfContribution = 1 / (k + result.rank);
      const existing = fusedScores.get(uuid);

      if (existing) {
        existing.rrfScore += rrfContribution;
        existing.semanticRank = result.rank;
        existing.semanticScore = result.score;
      } else {
        fusedScores.set(uuid, {
          rrfScore: rrfContribution,
          keywordRank: null,
          semanticRank: result.rank,
          keywordScore: 0,
          semanticScore: result.score,
          data: result.data,
        });
      }
    }

    const results: HybridSearchResult[] = [];
    for (const [uuid, fused] of fusedScores) {
      results.push({
        uuid,
        name: fused.data.name,
        description: fused.data.description,
        mcpServerUuid: fused.data.mcpServerUuid,
        keywordScore: fused.keywordScore,
        semanticScore: fused.semanticScore,
        hybridScore: fused.rrfScore,
        keywordRank: fused.keywordRank,
        semanticRank: fused.semanticRank,
      });
    }

    results.sort((a, b) => b.hybridScore - a.hybridScore);
    return results;
  }

  private async keywordSearchOnly(
    query: string,
    limit: number,
  ): Promise<HybridSearchResult[]> {
    const keywordResults = await this.runKeywordSearch(query, limit);

    return Array.from(keywordResults.values()).map((r, index) => ({
      uuid: r.data.uuid,
      name: r.data.name,
      description: r.data.description,
      mcpServerUuid: r.data.mcpServerUuid,
      keywordScore: r.score,
      semanticScore: 0,
      hybridScore: r.score,
      keywordRank: index + 1,
      semanticRank: null,
    }));
  }

  private async semanticSearchOnly(
    query: string,
    limit: number,
    threshold: number,
  ): Promise<HybridSearchResult[]> {
    const semanticResults = await this.runSemanticSearch(
      query,
      limit,
      threshold,
    );

    return Array.from(semanticResults.values()).map((r, index) => ({
      uuid: r.data.uuid,
      name: r.data.name,
      description: r.data.description,
      mcpServerUuid: r.data.mcpServerUuid,
      keywordScore: 0,
      semanticScore: r.score,
      hybridScore: r.score,
      keywordRank: null,
      semanticRank: index + 1,
    }));
  }

  async quickSearch(
    query: string,
    limit: number = 10,
  ): Promise<HybridSearchResult[]> {
    return this.search(query, { limit, keywordOnly: true });
  }

  async deepSearch(
    query: string,
    limit: number = 10,
  ): Promise<HybridSearchResult[]> {
    return this.search(query, { limit, semanticThreshold: 0.2 });
  }
}

export const hybridSearchService = new HybridSearchService();
