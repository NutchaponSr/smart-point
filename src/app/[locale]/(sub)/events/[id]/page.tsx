import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { EventInfoView } from "@/modules/events/ui/views/event-info-view";

interface Props {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: Props) => {
  const { id } = await params;

  prefetch(crpc.activity.getOne.queryOptions({ activityId: id }));

  return (
    <HydrateClient>
      <EventInfoView activityId={id} />
    </HydrateClient>
  );
};

export default Page;