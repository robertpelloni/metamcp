import { createAppRouter } from "@repo/trpc";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { type CreateTRPCReact, createTRPCReact } from "@trpc/react-query";

function isJsonResponse(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return /application\/(?:[\w!#$%&*.^`~-]*\+)?json/i.test(contentType);
}

async function trpcFetchWithDiagnostics(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type");
  if (isJsonResponse(contentType)) {
    return response;
  }

  const responseText = await response.text();
  const requestUrl = typeof input === "string" ? input : input.toString();
  const preview = responseText.slice(0, 300);

  throw new Error(
    `[tRPC] Expected JSON response but received ${contentType || "unknown content-type"} (status ${response.status}) from ${requestUrl}. Response preview: ${preview}`,
  );
}

// Create a type that matches the backend router
type AppRouter = ReturnType<typeof createAppRouter>;

// Create the tRPC client
export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();

// Create tRPC client with HTTP link configured for better-auth
export const reactTrpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/trpc",
      // Include credentials and surface non-JSON responses with actionable diagnostics.
      fetch: trpcFetchWithDiagnostics,
    }),
  ],
});

export const vanillaTrpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
      // Include credentials and surface non-JSON responses with actionable diagnostics.
      fetch: trpcFetchWithDiagnostics,
    }),
  ],
});
