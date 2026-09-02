import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { EditEventView } from "@/modules/events/ui/views/edit-event-view";

interface Props {
  params: Promise<{ eventId: string }>;
}

const Page = async ({ params }: Props) => {
  const { eventId } = await params;

  prefetch(crpc.activity.getOne.queryOptions({ activityId: eventId }));

  return (
    <HydrateClient>
      <EditEventView eventId={eventId} />
    </HydrateClient>
  );
};

export default Page;
