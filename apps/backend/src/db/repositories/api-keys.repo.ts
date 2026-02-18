import {
  ApiKeyCreateInput,
  ApiKeyType,
  ApiKeyUpdateInput,
} from "@repo/zod-types";
import { ApiKeysJsonRepository } from "./api-keys-json.repo";

// Default to JSON repository for now. 
// In the future, we can add a factory or config switch here.
const jsonRepo = new ApiKeysJsonRepository();

export class ApiKeysRepository {
  async create(input: ApiKeyCreateInput) {
    return jsonRepo.create(input);
  }

  async findByUserId(userId: string) {
    return jsonRepo.findByUserId(userId);
  }

  async findAll() {
    return jsonRepo.findAll();
  }

  async findPublicApiKeys() {
    return jsonRepo.findPublicApiKeys();
  }

  async findAccessibleToUser(userId: string) {
    return jsonRepo.findAccessibleToUser(userId);
  }

  async findByUuid(uuid: string, userId: string) {
    return jsonRepo.findByUuid(uuid, userId);
  }

  async findByUuidWithAccess(uuid: string, userId?: string) {
    return jsonRepo.findByUuidWithAccess(uuid, userId);
  }

  async validateApiKey(key: string) {
    return jsonRepo.validateApiKey(key);
  }

  async update(uuid: string, userId: string, input: ApiKeyUpdateInput) {
    return jsonRepo.update(uuid, userId, input);
  }

  async delete(uuid: string, userId: string) {
    return jsonRepo.delete(uuid, userId);
  }
}
