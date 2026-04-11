import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { BetterConvexProvider } from "@/lib/convex/convex-provider";
import { caller, crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { Modals } from "@/components/modals";

export async function Providers({ children }: { children: React.ReactNode }) {
  const token = await caller.getToken();

  prefetch(crpc.user.getCurrentUser.queryOptions());

  return (
    <NuqsAdapter>
      <BetterConvexProvider token={token}>
        <HydrateClient>
          {children}
          <Toaster position="top-center" richColors />
          <Modals />
        </HydrateClient>
      </BetterConvexProvider>
    </NuqsAdapter>
  );
}