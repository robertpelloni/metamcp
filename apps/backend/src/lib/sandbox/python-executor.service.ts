import { execa } from "execa";
import { configService } from "../../config.service";

export class PythonExecutorService {
  private pythonAvailable: boolean | null = null;

  /**
   * Check if python3 is available in the environment.
   */
  private async ensurePythonAvailable(): Promise<void> {
    if (this.pythonAvailable === true) return;

    try {
      await execa("python3", ["--version"]);
      this.pythonAvailable = true;
    } catch (e) {
      this.pythonAvailable = false;
      throw new Error("Python 3 is not available in the environment. Please ensure it is installed.");
    }
  }

  /**
   * Run Python code in a secure-ish environment.
   */
  async execute(
    code: string,
    env?: Record<string, string>
  ): Promise<string> {
    try {
      await this.ensurePythonAvailable();

      // Use MCP timeout or default to 30s
      const timeout = await configService.getMcpTimeout();

      // Basic sanitization
      if (code.includes("subprocess.Popen") || code.includes("os.system") || code.includes("os.fork")) {
          console.warn("Potential dangerous code detected in Python executor.");
      }

      const { stdout, stderr } = await execa("python3", ["-c", code], {
          timeout: timeout || 30000,
          reject: false,
          input: code,
          env: {
              ...process.env,
              PATH: process.env.PATH,
              LANG: "en_US.UTF-8",
              ...env
          },
          extendEnv: false
      });

      if (stderr) {
          return `Output:\n${stdout}\n\nErrors:\n${stderr}`;
      }
      return stdout;
    } catch (error: any) {
        if (error.timedOut) {
            return `Execution Failed: Timeout after ${error.timeout}ms`;
        }
        return `Execution Failed: ${error.message}`;
    }
  }
}

export const pythonExecutorService = new PythonExecutorService();
