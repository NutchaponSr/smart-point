"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useCRPC } from "@/lib/convex/crpc";
import {
  periodValues,
  useLeaderboardFilters,
} from "../../stores/use-leaderboard-filters";
import { LeaderboardScreen } from "../screens/leaderboard-screen";

export const LeaderboardView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useLeaderboardFilters();

  const { data } = useSuspenseQuery(
    crpc.leaderboard.getMany.queryOptions({
      period: filters.period,
      limit: filters.limit,
      cursor: filters.cursor,
    }),
  );

  const { data: myEntry } = useSuspenseQuery(
    crpc.leaderboard.getMyEntry.queryOptions({
      period: filters.period,
    }),
  );

  return (
    <>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[142.5px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">
            กระดานคะแนน
          </h1>
        </div>
        <div className="flex gap-3 overflow-x-auto">
          {periodValues.map((period) => (
            <Button
              key={period}
              variant={filters.period === period ? "rounded" : "roundedOutline"}
              size="smRounded"
              onClick={() => setFilters({ period, cursor: 0 })}
            >
              {period}
            </Button>
          ))}
        </div>
      </header>

      <LeaderboardScreen
        initialData={data.page}
        myEntry={myEntry}
        currentCursor={filters.cursor}
        limit={filters.limit}
        nextCursor={data.continueCursor}
        onChangeCursor={(cursor) => setFilters({ cursor })}
      />
    </>
  );
};
