import { type AppRouter } from "@repo/trpc";
import { registryService } from "../lib/registry/registry.service";

export const registryImplementations: AppRouter["frontend"]["registry"] = {
  list: async ({ input }) => {
    return registryService.listRegistryItems(input);
  },
  getCategories: async () => {
    return registryService.getCategories();
  },
};
