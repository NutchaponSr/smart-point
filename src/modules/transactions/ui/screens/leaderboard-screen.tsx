import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { useCallback } from "react";
import { Pagination } from "@/components/pagniation";

import { usePagination } from "@/hooks/use-pagination";
import { useCRPC } from "@/lib/convex/crpc";
import { useLeaderboardFilters } from "@/modules/transactions/stores/use-leaderboard-filters";
import { LeaderboardList } from "@/modules/transactions/ui/components/leaderboard-list";

export const LeaderboardScreen = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useLeaderboardFilters();

  const debouncedQuery = useDebounce(filters.q, 400);
  const filterResetKey = filters.division.join(",");

  const onPageChange = useCallback(
    (page: number) => {
      void setFilters({ page });
    },
    [setFilters],
  );

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange,
    resetKey: filterResetKey,
  });

  const normalizedQuery = debouncedQuery.trim() || undefined;

  const { data: leaderboard } = useSuspenseQuery(
    crpc.leaderboard.getMany.queryOptions({
      limit: filters.limit,
      cursor: requestCursor,
      q: normalizedQuery,
      division: filters.division.length > 0 ? filters.division : null,
    }),
  );

  const { data: currentUser } = useQuery(
    crpc.user.getCurrentUser.queryOptions(),
  );

  const canGoForward =
    leaderboard.hasNextPage && leaderboard.continueCursor != null;

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
        myEmployeeId={currentUser?.employeeId ?? null}
      />
    </section>
  );
};
