"use client";

import { Main } from "@/components/main";
import { Sort } from "@/components/sort";

import { LeaderboardScreen } from "@/modules/transactions/ui/screens/leaderboard-screen";

import {
  periodValues,
  useLeaderboardFilters,
} from "@/modules/transactions/stores/use-leaderboard-filters";

export const LeaderboardView = () => {
  const [filters, setFilters] = useLeaderboardFilters();

  return (
    <Main
      title="กระดานคะแนน"
      menu={
        <Sort 
          values={periodValues}
          activeValue={filters.period}
          onChange={(value) => setFilters({ ...filters, period: value as NonNullable<typeof filters.period> })}
        />
      }
    >
      <LeaderboardScreen />
    </Main>
  );
};
