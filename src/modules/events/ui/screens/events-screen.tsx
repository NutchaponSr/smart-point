import { ApiOutputs } from "@convex/api";

import { EventCard } from "@/modules/events/ui/components/event-card";
import { EventFilters } from "@/modules/events/ui/components/event-filters";

interface Props {
  initialActivities: ApiOutputs["activity"]["getMany"]["page"];
  onLoad: () => void;
  hasNextPage: boolean;
}

export const EventsScreen = ({
  initialActivities,
  onLoad,
  hasNextPage,
}: Props) => {
  return (
    <section className="space-y-4 p-4 md:p-8">
      <div className="grid grid-cols-1 items-start gap-x-16 gap-y-8 lg:grid-cols-[1fr_3fr]">
        <EventFilters />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-3">
          {initialActivities.map((activity) => (
            <EventCard key={activity._id} activity={activity} />
          ))}
        </div>
      </div>
    </section>
  );
};
