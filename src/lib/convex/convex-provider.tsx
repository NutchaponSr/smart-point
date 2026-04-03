"use client";

import {
  QueryClientProvider as TanstackQueryClientProvider,
} from "@tanstack/react-query";
import { ConvexAuthProvider } from "better-convex/auth/client";
import {
  ConvexReactClient,
  getConvexQueryClientSingleton,
  getQueryClientSingleton,
  useAuthStore
} from "better-convex/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { CRPCProvider } from "@/lib/convex/crpc";
import { authClient } from "@/lib/convex/auth-client";
import { createQueryClient } from "@/lib/convex/query-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function BetterConvexProvider({
  children,
  token
}: {
  children: React.ReactNode;
  token?: string;
}) {
  const router = useRouter();

  return (
    <ConvexAuthProvider
      authClient={authClient}
      client={convex}
      initialToken={token}
      onMutationUnauthorized={() => router.replace("/auth/sign-in")}
      onQueryUnauthorized={({ queryName }) => {
        if (process.env.NODE_ENV === "development") {
          toast.error(`${queryName} requires authentication`);
        } else {
          router.push("/auth/sign-in");
        }
      }}
    >
      <QueryClientProvider>
        {children}
      </QueryClientProvider>
    </ConvexAuthProvider>
  );
}

function QueryClientProvider({ children }: { children: React.ReactNode }) {
  const authStore = useAuthStore();

  const queryClient = getQueryClientSingleton(createQueryClient);
  const convexQueryClient = getConvexQueryClientSingleton({
    authStore,
    convex,
    queryClient,
  });

  return (
    <TanstackQueryClientProvider client={queryClient}>
      <CRPCProvider convexClient={convex} convexQueryClient={convexQueryClient}>
        {children}
      </CRPCProvider>
    </TanstackQueryClientProvider>
  );
}