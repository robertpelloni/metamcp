import { CreatePolicySchema, DeletePolicySchema, UpdatePolicySchema } from "@repo/zod-types";
import { z } from "zod";
import { policyService } from "../lib/access-control/policy.service";

export const policiesImplementations = {
  list: async () => {
    return await policyService.listPolicies();
  },
  create: async (input: z.infer<typeof CreatePolicySchema>) => {
    return await policyService.createPolicy(input.name, input.rules, input.description);
  },
  update: async (input: z.infer<typeof UpdatePolicySchema>) => {
    return await policyService.updatePolicy(input.uuid, {
      name: input.name,
      description: input.description,
      rules: input.rules,
    });
  },
  delete: async (input: z.infer<typeof DeletePolicySchema>) => {
    return await policyService.deletePolicy(input.uuid);
  },
};
