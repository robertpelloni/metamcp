import { SetConfigRequest } from "@repo/zod-types";

import { configService } from "../lib/config.service";
import {
  ConfigError,
  ValidationError,
  logError,
  wrapError,
} from "../lib/errors";

export const configImplementations = {
  getSignupDisabled: async (): Promise<boolean> => {
    try {
      return await configService.isSignupDisabled();
    } catch (error) {
      logError(error, "config.getSignupDisabled");
      throw wrapError(error, "Failed to get signup disabled setting");
    }
  },

  setSignupDisabled: async (input: {
    disabled: boolean;
  }): Promise<{ success: boolean }> => {
    try {
      await configService.setSignupDisabled(input.disabled);
      return { success: true };
    } catch (error) {
      logError(error, "config.setSignupDisabled", { value: input.disabled });
      throw wrapError(error, "Failed to update signup disabled setting");
    }
  },

  getSsoSignupDisabled: async (): Promise<boolean> => {
    try {
      return await configService.isSsoSignupDisabled();
    } catch (error) {
      logError(error, "config.getSsoSignupDisabled");
      throw wrapError(error, "Failed to get SSO signup disabled setting");
    }
  },

  setSsoSignupDisabled: async (input: {
    disabled: boolean;
  }): Promise<{ success: boolean }> => {
    try {
      await configService.setSsoSignupDisabled(input.disabled);
      return { success: true };
    } catch (error) {
      logError(error, "config.setSsoSignupDisabled", { value: input.disabled });
      throw wrapError(error, "Failed to update SSO signup disabled setting");
    }
  },

  getBasicAuthDisabled: async (): Promise<boolean> => {
    try {
      return await configService.isBasicAuthDisabled();
    } catch (error) {
      logError(error, "config.getBasicAuthDisabled");
      throw wrapError(error, "Failed to get basic auth disabled setting");
    }
  },

  setBasicAuthDisabled: async (input: {
    disabled: boolean;
  }): Promise<{ success: boolean }> => {
    try {
      await configService.setBasicAuthDisabled(input.disabled);
      return { success: true };
    } catch (error) {
      logError(error, "config.setBasicAuthDisabled", { value: input.disabled });
      throw wrapError(error, "Failed to update basic auth disabled setting");
    }
  },

  getMcpResetTimeoutOnProgress: async (): Promise<boolean> => {
    try {
      return await configService.getMcpResetTimeoutOnProgress();
    } catch (error) {
      logError(error, "config.getMcpResetTimeoutOnProgress");
      throw wrapError(
        error,
        "Failed to get MCP reset timeout on progress setting",
      );
    }
  },

  setMcpResetTimeoutOnProgress: async (input: {
    enabled: boolean;
  }): Promise<{ success: boolean }> => {
    try {
      await configService.setMcpResetTimeoutOnProgress(input.enabled);
      return { success: true };
    } catch (error) {
      logError(error, "config.setMcpResetTimeoutOnProgress", {
        value: input.enabled,
      });
      throw wrapError(
        error,
        "Failed to update MCP reset timeout on progress setting",
      );
    }
  },

  getMcpTimeout: async (): Promise<number> => {
    try {
      return await configService.getMcpTimeout();
    } catch (error) {
      logError(error, "config.getMcpTimeout");
      throw wrapError(error, "Failed to get MCP timeout setting");
    }
  },

  setMcpTimeout: async (input: {
    timeout: number;
  }): Promise<{ success: boolean }> => {
    try {
      // Validate timeout range
      if (input.timeout < 1000) {
        throw new ValidationError(
          "MCP timeout must be at least 1000ms (1 second)",
          "timeout",
          input.timeout,
        );
      }
      if (input.timeout > 3600000) {
        throw new ValidationError(
          "MCP timeout cannot exceed 3600000ms (1 hour)",
          "timeout",
          input.timeout,
        );
      }

      await configService.setMcpTimeout(input.timeout);
      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logError(error, "config.setMcpTimeout", { value: input.timeout });
      throw wrapError(error, "Failed to update MCP timeout setting");
    }
  },

  getMcpMaxTotalTimeout: async (): Promise<number> => {
    try {
      return await configService.getMcpMaxTotalTimeout();
    } catch (error) {
      logError(error, "config.getMcpMaxTotalTimeout");
      throw wrapError(error, "Failed to get MCP max total timeout setting");
    }
  },

  setMcpMaxTotalTimeout: async (input: {
    timeout: number;
  }): Promise<{ success: boolean }> => {
    try {
      // Validate timeout range
      if (input.timeout < 1000) {
        throw new ValidationError(
          "MCP max total timeout must be at least 1000ms (1 second)",
          "timeout",
          input.timeout,
        );
      }
      if (input.timeout > 7200000) {
        throw new ValidationError(
          "MCP max total timeout cannot exceed 7200000ms (2 hours)",
          "timeout",
          input.timeout,
        );
      }

      await configService.setMcpMaxTotalTimeout(input.timeout);
      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logError(error, "config.setMcpMaxTotalTimeout", { value: input.timeout });
      throw wrapError(error, "Failed to update MCP max total timeout setting");
    }
  },

  getMcpMaxAttempts: async (): Promise<number> => {
    try {
      return await configService.getMcpMaxAttempts();
    } catch (error) {
      logError(error, "config.getMcpMaxAttempts");
      throw wrapError(error, "Failed to get MCP max attempts setting");
    }
  },

  setMcpMaxAttempts: async (input: {
    maxAttempts: number;
  }): Promise<{ success: boolean }> => {
    try {
      // Validate attempts range
      if (input.maxAttempts < 1) {
        throw new ValidationError(
          "MCP max attempts must be at least 1",
          "maxAttempts",
          input.maxAttempts,
        );
      }
      if (input.maxAttempts > 10) {
        throw new ValidationError(
          "MCP max attempts cannot exceed 10",
          "maxAttempts",
          input.maxAttempts,
        );
      }

      await configService.setMcpMaxAttempts(input.maxAttempts);
      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logError(error, "config.setMcpMaxAttempts", { value: input.maxAttempts });
      throw wrapError(error, "Failed to update MCP max attempts setting");
    }
  },

  getSessionLifetime: async (): Promise<number | null> => {
    try {
      return await configService.getSessionLifetime();
    } catch (error) {
      logError(error, "config.getSessionLifetime");
      throw wrapError(error, "Failed to get session lifetime setting");
    }
  },

  setSessionLifetime: async (input: {
    lifetime?: number | null;
  }): Promise<{ success: boolean }> => {
    try {
      // Validate lifetime if provided
      if (input.lifetime !== null && input.lifetime !== undefined) {
        if (input.lifetime < 60) {
          throw new ValidationError(
            "Session lifetime must be at least 60 seconds (1 minute)",
            "lifetime",
            input.lifetime,
          );
        }
        if (input.lifetime > 31536000) {
          throw new ValidationError(
            "Session lifetime cannot exceed 31536000 seconds (1 year)",
            "lifetime",
            input.lifetime,
          );
        }
      }

      await configService.setSessionLifetime(input.lifetime);
      return { success: true };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logError(error, "config.setSessionLifetime", { value: input.lifetime });
      throw wrapError(error, "Failed to update session lifetime setting");
    }
  },

  getAllConfigs: async (): Promise<
    Array<{ id: string; value: string; description?: string | null }>
  > => {
    try {
      return await configService.getAllConfigs();
    } catch (error) {
      logError(error, "config.getAllConfigs");
      throw wrapError(error, "Failed to get all configurations");
    }
  },

  setConfig: async (input: SetConfigRequest): Promise<{ success: boolean }> => {
    try {
      await configService.setConfig(input.key, input.value, input.description);
      return { success: true };
    } catch (error) {
      logError(error, "config.setConfig", { key: input.key });

      // Check for invalid config key
      if (
        error instanceof Error &&
        error.message.includes("Invalid config key")
      ) {
        throw new ConfigError(input.key, "Unknown configuration key");
      }

      throw wrapError(error, `Failed to set configuration "${input.key}"`);
    }
  },

  getAuthProviders: async (): Promise<
    Array<{ id: string; name: string; enabled: boolean }>
  > => {
    try {
      return await configService.getAuthProviders();
    } catch (error) {
      logError(error, "config.getAuthProviders");
      throw wrapError(error, "Failed to get authentication providers");
    }
  },
};
