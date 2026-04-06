"use client";

import { useQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";
import { authClient } from "@/lib/convex/auth-client";

const Page = () => {
  const crpc = useCRPC();
  
  const { data: session } = authClient.useSession();

  const { data: wallets } = useQuery(crpc.wallet.getMany.queryOptions());

  return (
    <div>
      {JSON.stringify(session)}
      {JSON.stringify(wallets)}
    </div>
  );
};

export default Page;