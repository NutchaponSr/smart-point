import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { EventsView } from "@/modules/events/ui/views/events-view";

const Page = async () => {
  prefetch(crpc.activity.getMany.queryOptions());

  return (
    <HydrateClient>
      <EventsView />
    </HydrateClient>
  );
}

export default Page;