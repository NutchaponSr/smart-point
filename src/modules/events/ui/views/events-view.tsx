"use client";

import { useInfiniteQuery } from "better-convex/react";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { EventsScreen } from "@/modules/events/ui/screens/events-screen";

import { categories } from "@/modules/events/constants";
import { useEventFilters } from "@/modules/events/stores/use-event-filters";

type EventView = keyof typeof categories;

export const EventsView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useEventFilters();

  const { 
    data: activities, 
    fetchNextPage, 
    hasNextPage 
  } = useInfiniteQuery(crpc.activity.getMany.infiniteQueryOptions({
    q: filters.q,
    view: filters.view,
    minParticipants: filters.minParticipants ?? null,
    maxParticipants: filters.maxParticipants ?? null,
    isJoined: filters.isJoined,
  }))

  return (
    <div>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[142.5px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">
            กิจกรรม
          </h1>
        </div>
        <div className="flex gap-3 overflow-x-auto">
          {Object.entries(categories).map(([key, value]) => (
            <Button
              key={key}
              variant={filters.view === key ? "rounded" : "roundedOutline"}
              size="smRounded"
              onClick={() => setFilters({ ...filters, view: key as EventView })}
            >
              {value.th}
            </Button>
          ))}
        </div>
      </header>

      <EventsScreen
        initialActivities={activities}
        onLoad={() => fetchNextPage()}
        hasNextPage={hasNextPage}
      />
    </div>
  );
};
