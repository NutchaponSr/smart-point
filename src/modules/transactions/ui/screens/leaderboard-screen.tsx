import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";
import { SearchInput } from "@/components/search-input";

import { LeaderCard } from "@/modules/transactions/ui/components/leader-card";
import { columns } from "@/modules/transactions/ui/components/leaderboard-columns";
import { CurrentUserRankBar } from "@/modules/transactions/ui/components/current-user-rank-bar";

import { useLeaderboardFilters } from "@/modules/transactions/stores/use-leaderboard-filters";

export const LeaderboardScreen = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useLeaderboardFilters();

  const debouncedQuery = useDebounce(filters.q, 400);

  const {
    requestCursor,
    canGoBack,
    goBack,
    goForward,
  } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: leaderboard } = useSuspenseQuery(crpc.leaderboard.getMany.queryOptions({
    period: filters.period,
    limit: filters.limit,
    cursor: requestCursor,
    q: debouncedQuery,
  }));

  const { data: myEntry } = useSuspenseQuery(crpc.leaderboard.getMyEntry.queryOptions({
    period: filters.period,
  }));

  const canGoForward = leaderboard.hasNextPage && leaderboard.continueCursor != null;

  return (
    <section className="grid gap-4 p-4 md:p-8">
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {leaderboard.page.slice(0, 3).map((item, index) => (
          <LeaderCard
            key={item.employeeId}
            name={item.employeeName}
            src={item.employeeCode}
            rank={item.rank}
            podiumPlace={(index + 1) as 1 | 2 | 3}
            score={item.points}
          />
        ))}
      </div>

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

        <SearchInput
          variant="popover"
          value={filters.q}
          onChange={(q) => setFilters({ ...filters, q })}
          placeholder="ค้นหา"
        />
      </div>
      
      <DataTable 
        data={leaderboard.page.slice(3)}
        columns={columns()}
        footer={myEntry ? (
          <CurrentUserRankBar
            rank={myEntry.rank}
            name={myEntry.employeeName}
            points={myEntry.points}
          />
        ) : null}
      />
    </section>
  );
};
