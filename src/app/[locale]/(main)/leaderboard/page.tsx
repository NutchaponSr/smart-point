import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { LeaderboardView } from "@/modules/transactions/ui/views/leaderboard-view";
import { loadLeaderboardSearchParams } from "@/modules/transactions/search-params";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const { period, limit, q, division } =
    await loadLeaderboardSearchParams(searchParams);

  prefetch(crpc.leaderboard.getMany.queryOptions({
    period,
    limit,
    cursor: null,
    q: q.trim() || undefined,
    division: division.length > 0 ? division : null,
  }));
  prefetch(crpc.leaderboard.getMyEntry.queryOptions({
    period,
  }));

  return (
    <HydrateClient>
      <div className="mx-auto max-w-[1058px] pt-6 w-full">
        <LeaderboardView />
      </div>
    </HydrateClient>
  );
};

export default Page;