import { policyService } from "../../lib/access-control/policy.service";
import { BaseContext } from "@repo/trpc";

export const policiesImplementations = {
  list: async () => {
    return await policyService.listPolicies();
  },
  create: async (input: { name: string; rules: any[] }) => {
    return await policyService.createPolicy(input.name, input.rules);
  },
  update: async (input: { id: string; name: string; rules: any[] }) => {
    return await policyService.updatePolicy(input.id, input.name, input.rules);
  },
  delete: async (input: { id: string }) => {
    return await policyService.deletePolicy(input.id);
  }
};
