"use client";

import type { ApiOutputs } from "@convex/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { FormHeader } from "@/components/form-header";
import { pickLocalized } from "@/lib/i18n/localized";
import { useCRPC } from "@/lib/convex/crpc";

import {
  type NewsFormInput,
  type NewsSchema,
  newsSchema,
  toApiSummary,
} from "@/modules/news/schema";
import { NewsForm } from "@/modules/news/ui/components/news-form";
import { NewsPreview } from "@/modules/news/ui/components/news-preview";

type NewsGetOne = ApiOutputs["news"]["getOne"];

function toFormInput(row: NewsGetOne): NewsFormInput {
  return {
    title: {
      th: typeof row.title === "string" ? row.title : (row.title?.th ?? ""),
      en: typeof row.title === "string" ? row.title : (row.title?.en ?? ""),
    },
    summary: {
      th:
        typeof row.summary === "string"
          ? row.summary
          : (row.summary?.th ?? ""),
      en:
        typeof row.summary === "string"
          ? row.summary
          : (row.summary?.en ?? ""),
    },
    body: {
      th: typeof row.body === "string" ? row.body : (row.body?.th ?? ""),
      en: typeof row.body === "string" ? row.body : (row.body?.en ?? ""),
    },
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
  const locale = useLocale();
  const t = useTranslations("news.admin");

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
        summary: toApiSummary(data.summary),
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
        <FormHeader
          title={pickLocalized(news.title, locale)}
          backHref="/meta/news"
        />
        <div className="lg:grid lg:grid-cols-[1fr_30vw]">
          <div>
            <NewsForm />
          </div>
          <aside className="sticky top-0 hidden h-screen flex-col gap-4 self-start overflow-y-auto border-l-2 border-border bg-background p-6 lg:flex">
            <h2 className="text-xl leading-snug">{t("preview")}</h2>
            <NewsPreview />
          </aside>
        </div>
      </form>
    </FormProvider>
  );
};
