"use client";

import { format } from "date-fns";
import { th } from "date-fns/locale";
import { PinIcon } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import type { NewsFormInput } from "@/modules/news/schema";

export const NewsPreview = () => {
  const { control } = useFormContext<NewsFormInput>();
  const values = useWatch({ control });

  return (
    <article className="flex flex-col gap-4 rounded-md border-2 border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-muted-foreground">ตัวอย่าง</h3>
        {values.isPinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-pink/10 px-2 py-0.5 text-xs font-medium text-pink">
            <PinIcon className="size-3" />
            ปักหมุด
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <time className="text-xs text-muted-foreground">
          {format(new Date(), "d MMMM yyyy", { locale: th })}
        </time>
        <h4 className="text-lg font-bold leading-snug">
          {values.title || "หัวข้อข่าวสาร"}
        </h4>
        {values.summary && (
          <p className="text-sm text-muted-foreground">{values.summary}</p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {values.body || "เนื้อหาข่าวสารจะแสดงที่นี่"}
        </p>
      </div>

      <div className="border-t border-border pt-3">
        <span
          className={
            values.isPublished
              ? "text-xs font-medium text-[#58cc02]"
              : "text-xs text-muted-foreground"
          }
        >
          {values.isPublished ? "จะแสดงบนหน้าหลัก" : "แบบร่าง — ยังไม่แสดง"}
        </span>
      </div>
    </article>
  );
};
