import { eq } from "drizzle-orm";
import { db } from "../../db";
import { policiesTable } from "../../db/schema";
import { minimatch } from "minimatch";

export interface PolicyRule {
  allow: string[]; // Patterns like "github__*", "postgres__read_*"
  deny?: string[]; // Exceptions to allow
}

export class PolicyService {

  async createPolicy(name: string, rules: PolicyRule, description?: string): Promise<any> {
    const [policy] = await db
      .insert(policiesTable)
      .values({
        name,
        rules: rules as any, // Type cast for jsonb
        description
      })
      .returning();
    return policy;
  }

  async getPolicy(uuid: string): Promise<any> {
    const policy = await db.query.policiesTable.findFirst({
        where: eq(policiesTable.uuid, uuid)
    });
    return policy;
  }

  async getPolicyByName(name: string): Promise<any> {
    const policy = await db.query.policiesTable.findFirst({
        where: eq(policiesTable.name, name)
    });
    return policy;
  }

  async listPolicies(userId?: string): Promise<any[]> {
      // If userId is provided, filter by user (and maybe public ones if we had that concept)
      // For now listing all as typical tenancy assumption in this simplified service
      if (userId) {
          return await db.select().from(policiesTable).where(eq(policiesTable.user_id, userId));
      }
      return await db.select().from(policiesTable);
  }

  /**
   * Evaluate if a tool is allowed by a policy.
   * Logic:
   * 1. If explicit DENY match -> False
   * 2. If explicit ALLOW match -> True
   * 3. Default -> False (Strict allowlist)
   */
  evaluateAccess(policy: { rules: PolicyRule }, toolName: string): boolean {
    const { allow, deny } = policy.rules;

    // 1. Check DENY
    if (deny && deny.length > 0) {
        for (const pattern of deny) {
            if (minimatch(toolName, pattern)) {
                return false;
            }
        }
    }

    // 2. Check ALLOW
    if (allow && allow.length > 0) {
        for (const pattern of allow) {
            if (minimatch(toolName, pattern)) {
                return true;
            }
        }
    }

    // 3. Default Deny
    return false;
  }
}

export const policyService = new PolicyService();
