import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { loadEventFilters } from "@/modules/events/search-params";
import { MyEventView } from "@/modules/events/ui/views/my-event-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const { status, q, view, limit, page } = await loadEventFilters(searchParams);

  prefetch(crpc.activity.list.queryOptions({
    status: status,
    q: q,
    view: view,
    limit: limit,
    cursor: null,
  }));

  return (
    <HydrateClient>
      <MyEventView />
    </HydrateClient>
  )
}

export default Page;