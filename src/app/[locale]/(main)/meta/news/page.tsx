import type { SearchParams } from "nuqs/server";

import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";
import { loadNewsFilters } from "@/modules/news/search-params";
import { NewsAnalyticView } from "@/modules/news/ui/views/news-analytic-view";

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const params = await loadNewsFilters(searchParams);

  prefetch(
    crpc.news.getList.queryOptions({
      limit: params.limit,
      cursor: null,
      q: params.q,
    }),
  );

  return (
    <HydrateClient>
      <NewsAnalyticView />
    </HydrateClient>
  );
};

export default Page;
