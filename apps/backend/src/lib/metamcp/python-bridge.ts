import express from "express";
import { z } from "zod";

export type BridgeHandler = (name: string, args: any, meta?: any) => Promise<any>;

class PythonBridgeService {
  private handlers = new Map<string, BridgeHandler>();
  private readonly TIMEOUT_MS = 60000; // 1 minute validity for a token start? No, validity for the DURATION of the script.

  // We actually need to keep the handler valid as long as the script runs.
  // The script execution service should manage the lifecycle (register/unregister).

  registerHandler(token: string, handler: BridgeHandler) {
    this.handlers.set(token, handler);
  }

  unregisterHandler(token: string) {
    this.handlers.delete(token);
  }

  getHandler(token: string): BridgeHandler | undefined {
    return this.handlers.get(token);
  }
}

export const pythonBridgeService = new PythonBridgeService();

// Router
const pythonBridgeRouter = express.Router();
pythonBridgeRouter.use(express.json({ limit: "50mb" }));

pythonBridgeRouter.post("/call", async (req, res) => {
  try {
    const { token, name, args, meta } = req.body;

    if (!token || typeof token !== "string") {
      res.status(401).json({ error: "Missing or invalid token" });
      return;
    }

    const handler = pythonBridgeService.getHandler(token);
    if (!handler) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    // Call the handler (which calls the recursive MCP tool handler)
    try {
        const result = await handler(name, args, meta);
        res.json({ result });
    } catch (toolError: any) {
        // Return tool error as JSON
        res.status(500).json({ error: toolError.message, details: toolError });
    }

  } catch (error: any) {
    console.error("Python Bridge Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default pythonBridgeRouter;
