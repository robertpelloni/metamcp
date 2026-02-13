/**
 * Re-export shared utilities from the MCP SDK's stdio transport module.
 * This shim exists to provide local imports used by process-managed-transport.ts.
 */
export { ReadBuffer, serializeMessage } from "@modelcontextprotocol/sdk/shared/stdio.js";
