"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { XIcon } from "lucide-react";
import Link from "next/link";

import { useCRPC } from "@/lib/convex/crpc";
import { EventScreen } from "../screens/event-screen";

interface Props {
  activityId: string;
}

export const EventInfoView = ({ activityId }: Props) => {
  const crpc = useCRPC();

  const { data: activity, refetch } = useSuspenseQuery(
    crpc.activity.getOne.queryOptions({ activityId }),
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex border-b-2 border-border bg-[#f4f4f0] text-foreground h-[82px]">
        <Link
          href="/events"
          className="flex shrink-0 items-center justify-center border-r-2 border-border px-6 no-underline transition-colors hover:bg-accent"
        >
          <XIcon className="size-6 stroke-[1.75]" />
        </Link>
        <div className="flex min-h-18 min-w-0 flex-1 items-center justify-between gap-2 py-4 pr-4 pl-4">
          <h1 className="line-clamp-2 hidden! min-w-0 flex-1 text-2xl sm:block! truncate">
            {activity.name}
          </h1>
        </div>
      </header>
      <div className="flex min-h-0 flex-col gap-6 bg-background [scrollbar-gutter:stable] md:p-8 lg:flex-row lg:gap-8 lg:overflow-y-auto flex-1 lg:py-12 p-4 lg:px-32">
        <EventScreen activity={activity} onReload={refetch} />
      </div>
    </div>
  );
};
