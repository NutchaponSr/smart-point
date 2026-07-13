import { useCallback } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Pagination } from "@/components/pagniation";

import { LeaderboardList } from "@/modules/transactions/ui/components/leaderboard-list";

import { useLeaderboardFilters } from "@/modules/transactions/stores/use-leaderboard-filters";

export const LeaderboardScreen = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useLeaderboardFilters();

  const debouncedQuery = useDebounce(filters.q, 400);
  const filterResetKey = [filters.division.join(","), filters.period].join("|");

  const onPageChange = useCallback(
    (page: number) => {
      void setFilters({ page });
    },
    [setFilters],
  );

  const {
    requestCursor,
    canGoBack,
    goBack,
    goForward,
  } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange,
    resetKey: filterResetKey,
  });

  const normalizedQuery = debouncedQuery.trim() || undefined;

  const { data: leaderboard } = useSuspenseQuery(crpc.leaderboard.getMany.queryOptions({
    period: filters.period,
    limit: filters.limit,
    cursor: requestCursor,
    q: normalizedQuery,
    division: filters.division.length > 0 ? filters.division : null,
  }));

  const { data: myEntry } = useSuspenseQuery(crpc.leaderboard.getMyEntry.queryOptions({
    period: filters.period,
  }));

  const canGoForward = leaderboard.hasNextPage && leaderboard.continueCursor != null;

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 grow">
          <Pagination 
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onBack={goBack}
            onForward={() => {
              const c = leaderboard.continueCursor;
              if (c != null) goForward(c);
            }}
          />
        </div>
      </div>
      
      <LeaderboardList 
        entries={leaderboard.page}
        myEmployeeId={myEntry?.employeeId ?? null}
      />
    </section>
  );
};
