import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { EmployeeAnalyticView } from "@/modules/employee/ui/views/employee-analytic-view";
import { loadEmployeeFilters } from "@/modules/employee/search-params";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const { q, limit } = await loadEmployeeFilters(searchParams);

  prefetch(crpc.employee.getMany.queryOptions({
    limit: limit,
    cursor: null,
    query: q,
  }));

  return (
    <HydrateClient>
      <EmployeeAnalyticView />
    </HydrateClient>
  );
};

export default Page;