import type { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { getCarouselNow } from "@/modules/events/constants";
import { loadEventFilters } from "@/modules/events/search-params";
import { MyEventView } from "@/modules/events/ui/views/my-event-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const { status, q, view, limit, minParticipants, maxParticipants } =
    await loadEventFilters(searchParams);

  prefetch(crpc.wallet.getOne.queryOptions());
  prefetch(
    crpc.activity.recommended.queryOptions({
      limit: 10,
      now: getCarouselNow(),
    }),
  );

  prefetch(
    crpc.activity.getMany.queryOptions({
      q: q,
      view: view,
      limit: limit,
      cursor: null,
      minParticipants: minParticipants,
      maxParticipants: maxParticipants,
      eligibleOnly: true,
    }),
  );

  prefetch(
    crpc.activity.list.queryOptions({
      status: status,
      q: q,
      view: view,
      limit: limit,
      cursor: null,
    }),
  );

  return (
    <HydrateClient>
      <div className="mx-auto max-w-7xl pt-6 w-full">
        <MyEventView />
      </div>
    </HydrateClient>
  );
};

export default Page;
