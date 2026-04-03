"use client";

import { Button } from "@/components/ui/button";
import { useCRPC } from "@/lib/convex/crpc";
import { useMutation, useQuery } from "@tanstack/react-query";

const Page = () => {
  const crpc = useCRPC();

  const { data, isLoading } = useQuery(crpc.task.get.queryOptions());
  const create = useMutation(crpc.task.create.mutationOptions());

  if (isLoading) return <div>Loading...</div>;

  if (!data) return <div>No data</div>;

  return (
    <div>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <Button onClick={() => create.mutate({})}>Create</Button>
    </div>
  );
};

export default Page;