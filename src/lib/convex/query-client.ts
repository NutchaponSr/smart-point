import SuperJSON from "superjson";

import {
  type DefaultOptions,
  defaultShouldDehydrateQuery,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { isCRPCClientError, isCRPCError } from "better-convex/crpc";

export const hydrationConfig: Pick<DefaultOptions, "dehydrate" | "hydrate"> = {
  dehydrate: {
    serializeData: SuperJSON.serialize,
    shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) || query.state.status === "pending",
    shouldRedactErrors: () => false,
  },
  hydrate: {
    deserializeData: SuperJSON.deserialize,
  },
}

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isCRPCClientError(error)) {
          console.warn(`[CRPC] ${error.code}:`, error.functionName);
        }
      },
    }),
    defaultOptions: {
      ...hydrationConfig,
      mutations: {
        onError: (err, _variables, _context, mutation) => {
          const error = err as Error & { data?: { message?: string } };
          const meta = mutation.meta as
            | { errorMessage?: string; skipErrorToast?: boolean }
            | undefined;

          if (meta?.skipErrorToast) return;

          toast.error(error.data?.message || meta?.errorMessage || error.message || "Something went wrong");
        },
      },
      queries: {
        retry: (failureCount, error) => {
          if (isCRPCError(error)) return false;

          const message = error instanceof Error ? error.message : String(error);

          if (message.includes("timed out") && failureCount < 3) {
            console.warn(`[QueryClient] Retrying timed out query (attempt ${failureCount + 1}/3)`);
            return true;
          }

          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 30_000),
      },
    },
  })
}