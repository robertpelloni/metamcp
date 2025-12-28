import { eq, desc } from "drizzle-orm";
import { db } from "../../db";
import { policiesTable } from "../../db/schema";
import { minimatch } from "minimatch";

export interface PolicyRule {
  allow: string[]; // Patterns like "github__*", "postgres__read_*"
  deny?: string[]; // Exceptions to allow
}

export class PolicyService {

  async listPolicies(): Promise<any[]> {
    return await db.query.policiesTable.findMany({
      orderBy: [desc(policiesTable.updatedAt)],
    });
  }

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

  async updatePolicy(uuid: string, data: { name?: string; description?: string; rules?: PolicyRule }): Promise<any> {
    const [policy] = await db
      .update(policiesTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(policiesTable.uuid, uuid))
      .returning();
    return policy;
  }

  async deletePolicy(uuid: string): Promise<void> {
    await db.delete(policiesTable).where(eq(policiesTable.uuid, uuid));
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
