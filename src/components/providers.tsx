import { Toaster } from "sonner";

import { caller, HydrateClient } from "@/lib/convex/rsc";
import { BetterConvexProvider } from "@/lib/convex/convex-provider";

export async function Providers({ children }: { children: React.ReactNode }) {
  const token = await caller.getToken();

  return (
    <BetterConvexProvider token={token}>
      <HydrateClient>
        {children}
        <Toaster />
      </HydrateClient>
    </BetterConvexProvider>
  );
}