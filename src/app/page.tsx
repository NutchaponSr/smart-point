"use client";

import { Button } from "@/components/ui/button";
import { useCRPC } from "@/lib/convex/crpc";
import { authClient } from "@/lib/convex/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";

const Page = () => {
  const { data: session } = authClient.useSession();

  return (
    <div>
      {JSON.stringify(session)}
    </div>
  );
};

export default Page;