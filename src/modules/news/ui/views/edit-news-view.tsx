"use client";

import type { ApiOutputs } from "@convex/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { FormHeader } from "@/components/form-header";
import { useCRPC } from "@/lib/convex/crpc";

import {
  type NewsFormInput,
  type NewsSchema,
  newsSchema,
} from "@/modules/news/schema";
import { NewsForm } from "@/modules/news/ui/components/news-form";
import { NewsPreview } from "@/modules/news/ui/components/news-preview";

type NewsGetOne = ApiOutputs["news"]["getOne"];

function toFormInput(row: NewsGetOne): NewsFormInput {
  return {
    title: row.title,
    summary: row.summary ?? "",
    body: row.body,
    isPublished: row.isPublished,
    isPinned: row.isPinned ?? false,
  };
}

interface Props {
  newsId: string;
}

export const EditNewsView = ({ newsId }: Props) => {
  const crpc = useCRPC();
  const router = useRouter();

  const { data: news } = useSuspenseQuery(
    crpc.news.getOne.queryOptions({ newsId }),
  );

  const initial = useMemo(() => toFormInput(news), [news]);

  const form = useForm<NewsFormInput>({
    resolver: zodResolver(newsSchema),
    defaultValues: initial,
  });

  const update = useMutation(crpc.news.update.mutationOptions());

  const onSubmit = (data: NewsSchema) => {
    update.mutate(
      {
        newsId,
        title: data.title,
        summary: data.summary,
        body: data.body,
        isPublished: data.isPublished,
        isPinned: data.isPinned,
      },
      {
        onSuccess: () => {
          form.reset(data);
          router.push("/meta/news");
        },
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormHeader title={news.title} backHref="/meta/news" />
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <NewsForm />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col gap-4 self-start overflow-y-auto border-l-2 border-border bg-background p-6 lg:flex">
            <h2 className="text-xl leading-snug">ตัวอย่าง</h2>
            <NewsPreview />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};
