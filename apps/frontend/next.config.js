/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const isWindows = process.platform === "win32";
const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(frontendDir, "../..");

const nextConfig = {
  // Standalone output uses symlinks that can fail on Windows without Developer Mode/admin privileges.
  ...(isWindows ? {} : { output: "standalone" }),
  // Keep build output focused on compile/runtime issues; lint remains available via `pnpm --filter frontend lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingRoot: monorepoRoot,
  experimental: {
    proxyTimeout: 1000 * 120,
  },
  async rewrites() {
    // Use localhost for rewrites since frontend and backend run in the same container
    const backendUrl = "http://localhost:12009";

    return [
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },
      // OAuth endpoints - proxy all oauth paths
      {
        source: "/oauth/:path*",
        destination: `${backendUrl}/oauth/:path*`,
      },
      // Well-known endpoints - proxy all well-known paths
      {
        source: "/.well-known/:path*",
        destination: `${backendUrl}/.well-known/:path*`,
      },
      // Auth API endpoints
      {
        source: "/api/auth/:path*",
        destination: `${backendUrl}/api/auth/:path*`,
      },
      // Headless API endpoints
      {
        source: "/api/headless/:path*",
        destination: `${backendUrl}/api/headless/:path*`,
      },
      // Register endpoint for dynamic client registration
      {
        source: "/register",
        destination: `${backendUrl}/api/auth/register`,
      },
      {
        source: "/trpc/:path*",
        destination: `${backendUrl}/trpc/frontend/:path*`,
      },
      {
        source: "/mcp-proxy/:path*",
        destination: `${backendUrl}/mcp-proxy/:path*`,
      },
      {
        source: "/metamcp/:path*",
        destination: `${backendUrl}/metamcp/:path*`,
      },
      {
        source: "/service/:path*",
        destination: "https://metatool-service.jczstudio.workers.dev/:path*",
      },
    ];
  },
};

export default nextConfig;
