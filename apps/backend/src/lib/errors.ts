/**
 * MetaMCP Error Handling System
 *
 * Provides typed error classes with consistent error codes, messages,
 * and context for better debugging and user experience.
 *
 * @module errors
 * @version 3.2.8
 */

/**
 * Error codes for categorizing errors across the application.
 * Format: DOMAIN_SPECIFIC_ERROR
 */
export enum ErrorCode {
  // Generic errors (1xxx)
  UNKNOWN = "UNKNOWN_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // Database errors (2xxx)
  DB_CONNECTION = "DB_CONNECTION_ERROR",
  DB_QUERY = "DB_QUERY_ERROR",
  DB_CONSTRAINT = "DB_CONSTRAINT_ERROR",

  // MCP Server errors (3xxx)
  MCP_CONNECTION = "MCP_CONNECTION_ERROR",
  MCP_TIMEOUT = "MCP_TIMEOUT_ERROR",
  MCP_TOOL_EXECUTION = "MCP_TOOL_EXECUTION_ERROR",
  MCP_SERVER_CRASHED = "MCP_SERVER_CRASHED",
  MCP_SERVER_NOT_FOUND = "MCP_SERVER_NOT_FOUND",
  MCP_INVALID_RESPONSE = "MCP_INVALID_RESPONSE",

  // Tool errors (4xxx)
  TOOL_NOT_FOUND = "TOOL_NOT_FOUND",
  TOOL_DISABLED = "TOOL_DISABLED",
  TOOL_BLOCKED_BY_POLICY = "TOOL_BLOCKED_BY_POLICY",
  TOOL_INVALID_ARGUMENTS = "TOOL_INVALID_ARGUMENTS",

  // Policy errors (5xxx)
  POLICY_NOT_FOUND = "POLICY_NOT_FOUND",
  POLICY_INVALID_RULES = "POLICY_INVALID_RULES",
  POLICY_EVALUATION_FAILED = "POLICY_EVALUATION_FAILED",

  // Config errors (6xxx)
  CONFIG_INVALID_KEY = "CONFIG_INVALID_KEY",
  CONFIG_INVALID_VALUE = "CONFIG_INVALID_VALUE",

  // Auth errors (7xxx)
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED",
  AUTH_RATE_LIMITED = "AUTH_RATE_LIMITED",

  // Namespace errors (8xxx)
  NAMESPACE_NOT_FOUND = "NAMESPACE_NOT_FOUND",
  NAMESPACE_ACCESS_DENIED = "NAMESPACE_ACCESS_DENIED",
}

/**
 * Context object for providing additional error details.
 */
export interface ErrorContext {
  /** The entity type involved (e.g., "server", "tool", "policy") */
  entity?: string;
  /** The entity identifier (e.g., server UUID, tool name) */
  entityId?: string;
  /** The operation being performed (e.g., "create", "delete", "execute") */
  operation?: string;
  /** Additional metadata for debugging */
  metadata?: Record<string, unknown>;
  /** The original error if this wraps another error */
  cause?: Error;
}

/**
 * Base error class for all MetaMCP errors.
 * Provides structured error information for consistent handling.
 */
export class MetaMCPError extends Error {
  public readonly code: ErrorCode;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    context: ErrorContext = {},
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = "MetaMCPError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Returns a user-friendly error message.
   */
  toUserMessage(): string {
    return this.message;
  }

  /**
   * Returns detailed error info for logging.
   */
  toLogObject(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Returns a JSON-serializable representation.
   */
  toJSON(): Record<string, unknown> {
    return {
      error: true,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Error thrown when a requested resource is not found.
 */
export class NotFoundError extends MetaMCPError {
  constructor(entity: string, identifier: string, context: ErrorContext = {}) {
    super(`${entity} not found: ${identifier}`, ErrorCode.NOT_FOUND, {
      ...context,
      entity,
      entityId: identifier,
    });
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when a resource already exists.
 */
export class AlreadyExistsError extends MetaMCPError {
  constructor(entity: string, identifier: string, context: ErrorContext = {}) {
    super(`${entity} already exists: ${identifier}`, ErrorCode.ALREADY_EXISTS, {
      ...context,
      entity,
      entityId: identifier,
    });
    this.name = "AlreadyExistsError";
  }
}

/**
 * Error thrown for validation failures.
 */
export class ValidationError extends MetaMCPError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context: ErrorContext = {},
  ) {
    super(message, ErrorCode.VALIDATION, context);
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
  }
}

/**
 * Error thrown when user lacks authentication.
 */
export class UnauthorizedError extends MetaMCPError {
  constructor(
    message: string = "Authentication required",
    context: ErrorContext = {},
  ) {
    super(message, ErrorCode.UNAUTHORIZED, context);
    this.name = "UnauthorizedError";
  }
}

/**
 * Error thrown when user lacks permission.
 */
export class ForbiddenError extends MetaMCPError {
  constructor(
    message: string = "Access denied",
    resource?: string,
    context: ErrorContext = {},
  ) {
    super(
      resource ? `Access denied to ${resource}` : message,
      ErrorCode.FORBIDDEN,
      context,
    );
    this.name = "ForbiddenError";
  }
}

// ============================================================
// MCP-Specific Errors
// ============================================================

/**
 * Error thrown when MCP server connection fails.
 */
export class MCPConnectionError extends MetaMCPError {
  public readonly serverName: string;
  public readonly serverUuid?: string;

  constructor(serverName: string, reason: string, context: ErrorContext = {}) {
    super(
      `Failed to connect to MCP server "${serverName}": ${reason}`,
      ErrorCode.MCP_CONNECTION,
      { ...context, entity: "mcp_server", entityId: serverName },
    );
    this.name = "MCPConnectionError";
    this.serverName = serverName;
    this.serverUuid = context.entityId;
  }
}

/**
 * Error thrown when MCP operation times out.
 */
export class MCPTimeoutError extends MetaMCPError {
  public readonly serverName: string;
  public readonly operation: string;
  public readonly timeoutMs: number;

  constructor(
    serverName: string,
    operation: string,
    timeoutMs: number,
    context: ErrorContext = {},
  ) {
    super(
      `MCP server "${serverName}" timed out after ${timeoutMs}ms during ${operation}`,
      ErrorCode.MCP_TIMEOUT,
      { ...context, entity: "mcp_server", entityId: serverName, operation },
    );
    this.name = "MCPTimeoutError";
    this.serverName = serverName;
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Error thrown when tool execution fails.
 */
export class ToolExecutionError extends MetaMCPError {
  public readonly toolName: string;
  public readonly serverName?: string;

  constructor(
    toolName: string,
    reason: string,
    serverName?: string,
    context: ErrorContext = {},
  ) {
    const serverInfo = serverName ? ` on server "${serverName}"` : "";
    super(
      `Tool "${toolName}"${serverInfo} execution failed: ${reason}`,
      ErrorCode.MCP_TOOL_EXECUTION,
      { ...context, entity: "tool", entityId: toolName },
    );
    this.name = "ToolExecutionError";
    this.toolName = toolName;
    this.serverName = serverName;
  }
}

/**
 * Error thrown when MCP server crashes.
 */
export class MCPServerCrashedError extends MetaMCPError {
  public readonly serverName: string;
  public readonly attempts: number;

  constructor(
    serverName: string,
    attempts: number,
    context: ErrorContext = {},
  ) {
    super(
      `MCP server "${serverName}" has crashed ${attempts} time(s) and is temporarily disabled`,
      ErrorCode.MCP_SERVER_CRASHED,
      {
        ...context,
        entity: "mcp_server",
        entityId: serverName,
        metadata: { attempts },
      },
    );
    this.name = "MCPServerCrashedError";
    this.serverName = serverName;
    this.attempts = attempts;
  }
}

// ============================================================
// Policy Errors
// ============================================================

/**
 * Error thrown when policy is not found.
 */
export class PolicyNotFoundError extends MetaMCPError {
  constructor(policyId: string, context: ErrorContext = {}) {
    super(`Policy not found: ${policyId}`, ErrorCode.POLICY_NOT_FOUND, {
      ...context,
      entity: "policy",
      entityId: policyId,
    });
    this.name = "PolicyNotFoundError";
  }
}

/**
 * Error thrown when tool is blocked by policy.
 */
export class ToolBlockedByPolicyError extends MetaMCPError {
  public readonly toolName: string;
  public readonly policyName?: string;
  public readonly reason?: string;

  constructor(
    toolName: string,
    policyName?: string,
    reason?: string,
    context: ErrorContext = {},
  ) {
    const policyInfo = policyName ? ` by policy "${policyName}"` : " by policy";
    const reasonInfo = reason ? `: ${reason}` : "";
    super(
      `Tool "${toolName}" blocked${policyInfo}${reasonInfo}`,
      ErrorCode.TOOL_BLOCKED_BY_POLICY,
      {
        ...context,
        entity: "tool",
        entityId: toolName,
        metadata: { policyName, reason },
      },
    );
    this.name = "ToolBlockedByPolicyError";
    this.toolName = toolName;
    this.policyName = policyName;
    this.reason = reason;
  }
}

// ============================================================
// Database Errors
// ============================================================

/**
 * Error thrown for database operation failures.
 */
export class DatabaseError extends MetaMCPError {
  public readonly operation: string;
  public readonly table?: string;

  constructor(
    operation: string,
    reason: string,
    table?: string,
    context: ErrorContext = {},
  ) {
    const tableInfo = table ? ` on table "${table}"` : "";
    super(
      `Database ${operation} failed${tableInfo}: ${reason}`,
      ErrorCode.DB_QUERY,
      { ...context, operation, metadata: { table } },
    );
    this.name = "DatabaseError";
    this.operation = operation;
    this.table = table;
  }
}

// ============================================================
// Config Errors
// ============================================================

/**
 * Error thrown for invalid configuration.
 */
export class ConfigError extends MetaMCPError {
  public readonly configKey: string;

  constructor(configKey: string, reason: string, context: ErrorContext = {}) {
    super(
      `Configuration error for "${configKey}": ${reason}`,
      ErrorCode.CONFIG_INVALID_VALUE,
      { ...context, entity: "config", entityId: configKey },
    );
    this.name = "ConfigError";
    this.configKey = configKey;
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Wraps an unknown error into a MetaMCPError.
 * Preserves MetaMCPError instances, wraps others with context.
 */
export function wrapError(
  error: unknown,
  fallbackMessage: string,
  context: ErrorContext = {},
): MetaMCPError {
  if (error instanceof MetaMCPError) {
    return error;
  }

  if (error instanceof Error) {
    return new MetaMCPError(
      `${fallbackMessage}: ${error.message}`,
      ErrorCode.UNKNOWN,
      { ...context, cause: error },
    );
  }

  return new MetaMCPError(
    `${fallbackMessage}: ${String(error)}`,
    ErrorCode.UNKNOWN,
    context,
  );
}

/**
 * Type guard to check if an error is a MetaMCPError.
 */
export function isMetaMCPError(error: unknown): error is MetaMCPError {
  return error instanceof MetaMCPError;
}

/**
 * Extracts a user-friendly message from any error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof MetaMCPError) {
    return error.toUserMessage();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Creates a standardized error response object.
 */
export function createErrorResponse(error: unknown): {
  success: false;
  error: string;
  code?: ErrorCode;
  context?: ErrorContext;
} {
  if (error instanceof MetaMCPError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      context: error.context,
    };
  }

  return {
    success: false,
    error: getErrorMessage(error),
  };
}

/**
 * Logs an error with consistent formatting.
 */
export function logError(
  error: unknown,
  operation: string,
  additionalContext?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();

  if (error instanceof MetaMCPError) {
    console.error(`[${timestamp}] [${operation}]`, {
      ...error.toLogObject(),
      ...additionalContext,
    });
  } else if (error instanceof Error) {
    console.error(`[${timestamp}] [${operation}]`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...additionalContext,
    });
  } else {
    console.error(`[${timestamp}] [${operation}]`, {
      error: String(error),
      ...additionalContext,
    });
  }
}
