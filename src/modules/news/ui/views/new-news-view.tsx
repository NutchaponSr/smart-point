"use client";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { useCRPC } from "@/lib/convex/crpc";
import { FormHeader } from "@/components/form-header";

import {
  type NewsFormInput,
  type NewsSchema,
  newsSchema,
} from "@/modules/news/schema";
import { NewsForm } from "@/modules/news/ui/components/news-form";
import { NewsPreview } from "@/modules/news/ui/components/news-preview";

export const NewNewsView = () => {
  const crpc = useCRPC();
  const router = useRouter();

  const create = useMutation(crpc.news.create.mutationOptions());

  const form = useForm<NewsFormInput>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: "",
      summary: "",
      body: "",
      isPublished: false,
      isPinned: false,
    },
  });

  const onSubmit = (data: NewsSchema) => {
    create.mutate(
      {
        title: data.title,
        summary: data.summary,
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
        <FormHeader title="เพิ่มข่าวสาร" backHref="/meta/news" />
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
