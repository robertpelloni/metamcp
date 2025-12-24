import { execa } from "execa";
import { configService } from "../../config.service";

export class PythonExecutorService {
  /**
   * Run Python code in a secure-ish environment.
   * Currently uses local python3.
   * Future: Use Docker or gVisor.
   */
  async execute(code: string): Promise<string> {
    try {
      // Basic check for python availability
      // In production Dockerfile, we ensured python3 is installed.

      const { stdout, stderr } = await execa("python3", ["-c", code], {
          timeout: 30000, // 30s timeout
          reject: false,  // Don't throw on non-zero exit, just return result
          input: code     // Can also pass via stdin if -c gets too long, but -c is safer for simple scripts
      });

      if (stderr) {
          return `Output:\n${stdout}\n\nErrors:\n${stderr}`;
      }
      return stdout;
    } catch (error: any) {
        return `Execution Failed: ${error.message}`;
    }
  }
}

export const pythonExecutorService = new PythonExecutorService();
