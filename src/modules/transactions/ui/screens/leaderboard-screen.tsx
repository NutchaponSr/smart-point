import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { Pagination } from "@/components/pagniation";

import { usePagination } from "@/hooks/use-pagination";
import { useCRPC } from "@/lib/convex/crpc";
import { useLeaderboardFilters } from "@/modules/transactions/stores/use-leaderboard-filters";
import { LeaderboardList } from "@/modules/transactions/ui/components/leaderboard-list";

export const LeaderboardScreenFallback = () => (
  <section className="grid gap-4" aria-busy="true" aria-label="กำลังโหลดอันดับ">
    <div className="h-10" />
    <div className="overflow-hidden bg-background">
      <ul>
        {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((id) => (
          <li key={id} className="flex items-center gap-4 px-4 py-3">
            <span className="size-10 shrink-0 rounded-full bg-muted" />
            <span className="size-12 shrink-0 rounded-full bg-muted" />
            <span className="h-4 min-w-0 flex-1 rounded bg-muted" />
            <span className="h-6 w-16 shrink-0 rounded bg-muted" />
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export const LeaderboardScreen = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useLeaderboardFilters();

  const debouncedQuery = useDebounce(filters.q, 400);
  const filterResetKey = filters.division.join(",");

  const onPageChange = (page: number) => {
    void setFilters({ page });
  };

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange,
    resetKey: filterResetKey,
  });

  const normalizedQuery = debouncedQuery.trim() || undefined;

  const { data: leaderboard, isPlaceholderData } = useQuery({
    ...crpc.leaderboard.getMany.queryOptions({
      limit: filters.limit,
      cursor: requestCursor,
      q: normalizedQuery,
      division: filters.division.length > 0 ? filters.division : null,
    }),
    placeholderData: keepPreviousData,
  });

  const { data: currentUser } = useQuery(
    crpc.user.getCurrentUser.queryOptions(),
  );

  if (!leaderboard) {
    return <LeaderboardScreenFallback />;
  }

  const canGoForward =
    !isPlaceholderData &&
    leaderboard.hasNextPage &&
    leaderboard.continueCursor != null;

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
