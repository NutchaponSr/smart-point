"use client";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { useCRPC } from "@/lib/convex/crpc";
import { FormHeader } from "@/components/form-header";

import {
  type NewsFormInput,
  type NewsSchema,
  newsSchema,
  toApiSummary,
} from "@/modules/news/schema";
import { NewsForm } from "@/modules/news/ui/components/news-form";
import { NewsPreview } from "@/modules/news/ui/components/news-preview";

export const NewNewsView = () => {
  const crpc = useCRPC();
  const router = useRouter();
  const t = useTranslations("news.admin");

  const create = useMutation(crpc.news.create.mutationOptions());

  const form = useForm<NewsFormInput>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: { th: "", en: "" },
      summary: { th: "", en: "" },
      body: { th: "", en: "" },
      isPublished: false,
      isPinned: false,
    },
  });

  const onSubmit = (data: NewsSchema) => {
    create.mutate(
      {
        title: data.title,
        summary: toApiSummary(data.summary),
        body: data.body,
        isPublished: data.isPublished,
        isPinned: data.isPinned,
      },
      {
        onSuccess: () => {
          router.push("/meta/news");
        },
      },
    );
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormHeader title={t("new-title")} backHref="/meta/news" />
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
