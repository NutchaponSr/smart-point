import type { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";
import { loadLeaderboardSearchParams } from "@/modules/transactions/search-params";
import { LeaderboardView } from "@/modules/transactions/ui/views/leaderboard-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const { limit, q, division } =
    await loadLeaderboardSearchParams(searchParams);

  prefetch(
    crpc.leaderboard.getMany.queryOptions({
      limit,
      cursor: null,
      q: q.trim() || undefined,
      division: division.length > 0 ? division : null,
    }),
  );

  return (
    <HydrateClient>
      <div className="mx-auto max-w-[1058px] pt-6 w-full">
        <LeaderboardView />
      </div>
    </HydrateClient>
  );
};

export default Page;
