import {
  CreatePolicySchema,
  DeletePolicySchema,
  UpdatePolicySchema,
} from "@repo/zod-types";
import { z } from "zod";
import { policyService } from "../lib/access-control/policy.service";
import {
  NotFoundError,
  ValidationError,
  logError,
  wrapError,
} from "../lib/errors";

export const policiesImplementations = {
  list: async () => {
    try {
      return await policyService.listPolicies();
    } catch (error) {
      logError(error, "policies.list");
      throw wrapError(error, "Failed to list policies");
    }
  },

  create: async (input: z.infer<typeof CreatePolicySchema>) => {
    try {
      // Validate rules structure
      if (
        !input.rules ||
        (Array.isArray(input.rules) && input.rules.length === 0)
      ) {
        throw new ValidationError(
          "Policy must have at least one rule",
          "rules",
          input.rules,
        );
      }

      return await policyService.createPolicy(
        input.name,
        input.rules,
        input.description,
      );
    } catch (error) {
      logError(error, "policies.create", { policyName: input.name });

      if (error instanceof ValidationError) {
        throw error;
      }

      // Check for duplicate name constraint
      if (
        error instanceof Error &&
        error.message.includes("UNIQUE constraint")
      ) {
        throw new ValidationError(
          `Policy with name "${input.name}" already exists`,
          "name",
          input.name,
        );
      }

      throw wrapError(error, `Failed to create policy "${input.name}"`);
    }
  },

  update: async (input: z.infer<typeof UpdatePolicySchema>) => {
    try {
      // Check if policy exists first
      const existing = await policyService.getPolicy(input.uuid);
      if (!existing) {
        throw new NotFoundError("Policy", input.uuid);
      }

      const result = await policyService.updatePolicy(input.uuid, {
        name: input.name,
        description: input.description,
        rules: input.rules,
      });

      return result;
    } catch (error) {
      logError(error, "policies.update", { policyUuid: input.uuid });

      if (error instanceof NotFoundError) {
        throw error;
      }

      throw wrapError(error, `Failed to update policy "${input.uuid}"`);
    }
  },

  delete: async (input: z.infer<typeof DeletePolicySchema>) => {
    try {
      // Check if policy exists first
      const existing = await policyService.getPolicy(input.uuid);
      if (!existing) {
        throw new NotFoundError("Policy", input.uuid);
      }

      await policyService.deletePolicy(input.uuid);
      return {
        success: true,
        message: `Policy "${existing.name}" deleted successfully`,
      };
    } catch (error) {
      logError(error, "policies.delete", { policyUuid: input.uuid });

      if (error instanceof NotFoundError) {
        throw error;
      }

      // Check if policy is in use
      if (
        error instanceof Error &&
        error.message.includes("foreign key constraint")
      ) {
        throw new ValidationError(
          `Cannot delete policy "${input.uuid}": it is currently assigned to one or more namespaces`,
          "uuid",
          input.uuid,
        );
      }

      throw wrapError(error, `Failed to delete policy "${input.uuid}"`);
    }
  },
};
