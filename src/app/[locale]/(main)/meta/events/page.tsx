import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { EventsView } from "@/modules/events/ui/views/events-view";

import { loadEventFilters } from "@/modules/events/search-params";

interface Props {
  searchParams: Promise<SearchParams>
}

const Page = async ({ searchParams }: Props) => {
  const { q, view, minParticipants, maxParticipants, limit } = await loadEventFilters(searchParams);

  prefetch(crpc.activity.getMany.queryOptions({
    q: q,
    view: view,
    minParticipants: minParticipants,
    maxParticipants: maxParticipants,
    limit: limit,
    cursor: null,
  }));

  return (
    <HydrateClient>
      <EventsView />
    </HydrateClient>
  );
}

export default Page;