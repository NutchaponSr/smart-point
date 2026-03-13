"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props {
  preloadedQuery: Preloaded<typeof api.employee.getMany>;
}

export const Client = ({ preloadedQuery }: Props) => {
  const router = useRouter();

  const session = authClient.useSession();
  const employees = usePreloadedQuery(preloadedQuery);

  return (
    <>
      <pre>{JSON.stringify(employees, null, 2)}</pre>
      <Button 
        onClick={() => authClient.signOut({},{
          onSuccess: () => {
            router.refresh();
          },
          onError: (error) => {
            console.error(error);
          },
        })}
      >
        Sign Out
      </Button>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </>
  );
}