import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";
import { EditNewsView } from "@/modules/news/ui/views/edit-news-view";

interface Props {
  params: Promise<{ newsId: string }>;
}

const Page = async ({ params }: Props) => {
  const { newsId } = await params;

  prefetch(crpc.news.getOne.queryOptions({ newsId }));

  return (
    <HydrateClient>
      <EditNewsView newsId={newsId} />
    </HydrateClient>
  );
};

export default Page;
