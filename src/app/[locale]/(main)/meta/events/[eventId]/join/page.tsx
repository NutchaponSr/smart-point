import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { JoinEventView } from "@/modules/events/ui/views/join-event-view";

interface Props {
  params: Promise<{ eventId: string }>;
}

const Page = async ({ params }: Props) => {
  const { eventId } = await params;

  prefetch(crpc.activity.getOne.queryOptions({ activityId: eventId }));

  return (
    <HydrateClient>
      <JoinEventView eventId={eventId} />
    </HydrateClient>
  );
};

export default Page;
