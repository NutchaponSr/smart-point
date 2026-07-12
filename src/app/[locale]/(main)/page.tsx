import { startOfMonth } from "date-fns";
import { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { getCarouselNow } from "@/modules/events/constants";
import { OverviewsView } from "@/modules/overviews/ui/views/overviews-view";
import {
  loadFeedFilters,
  loadTransactionFilters,
} from "@/modules/transactions/search-params";

interface Props {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
  const [params, feedParams] = await Promise.all([
    loadTransactionFilters(searchParams),
    loadFeedFilters(searchParams),
  ]);

  prefetch(crpc.wallet.getOne.queryOptions());
  prefetch(crpc.news.getLatest.queryOptions({ limit: 5 }));
  prefetch(crpc.reward.getMany.queryOptions());
  prefetch(crpc.transaction.getMonthlyQuestProgress.queryOptions({ monthStart: startOfMonth(new Date()).getTime() }));  
  prefetch(
    crpc.activity.recommended.queryOptions({
      limit: 10,
      now: getCarouselNow(),
    }),
  );
  prefetch(
    crpc.transaction.getMany.queryOptions({
      q: params.q,
      self: true,
      limit: params.limit,
      cursor: null,
      status: params.status,
      min: params.min,
      max: params.max,
      from: params.from,
      to: params.to,
      view: params.view,
      by: params.by,
    })
  );
  prefetch(
    crpc.transaction.feeds.infiniteQueryOptions({
      view: feedParams.feedView,
      q: feedParams.feedQ || null,
      min: feedParams.feedMin > 0 ? feedParams.feedMin : null,
      max: feedParams.feedMax > 0 ? feedParams.feedMax : null,
      from: feedParams.feedFrom,
      to: feedParams.feedTo,
    }),
  );

  return (
    <HydrateClient>
      <div className="mx-auto w-full max-w-[1058px] pt-6">
        <OverviewsView />
      </div>
    </HydrateClient>
  );
}

export default Page;