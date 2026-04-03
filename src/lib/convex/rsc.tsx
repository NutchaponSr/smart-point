import "server-only";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import {
  createServerCRPCProxy,
  getServerQueryClientOptions
} from "better-convex/rsc";
import { cache } from "react";
import { api } from "@convex/api";
import { headers } from "next/headers";
import type { FetchQueryOptions } from "@tanstack/react-query";

import { hydrationConfig } from "@/lib/convex/query-client";
import { createCaller, createContext } from "@/lib/convex/server";

const createRSCContext = cache(async () => createContext({ headers: await headers() }));

export const crpc = createServerCRPCProxy({ api });
export const caller = createCaller(createRSCContext);

function createServerQueryClient() {
  return new QueryClient({
    defaultOptions: {
      ...hydrationConfig,
      ...getServerQueryClientOptions({
        getToken: caller.getToken,
        convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
      }),
    },
  });
}

export const getQueryClient = cache(createServerQueryClient);

export function prefetch<T extends { queryKey: readonly unknown[] }>(qyeryOptions: T): void {
  void getQueryClient().prefetchQuery(qyeryOptions);
}

export function preloadQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = readonly unknown[]
>(
  options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): Promise<TData> {
  return getQueryClient().fetchQuery(options);
}

export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      {children}
    </HydrationBoundary>
  );
}