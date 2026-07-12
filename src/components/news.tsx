"use client";

import Image from "next/image";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ChevronDownIcon, PinIcon } from "lucide-react";

import { useCRPC } from "@/lib/convex/crpc";
import { cn } from "@/lib/utils";

import NotFoundImage from "../../public/extra_character_e.svg";

export const News = () => {
  const crpc = useCRPC();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: items } = useSuspenseQuery(
    crpc.news.getLatest.queryOptions({ limit: 5 }),
  );

  if (items.length === 0) {
    return (
      <article className="flex flex-col gap-4 rounded-md border-2 bg-background p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold leading-7">ข่าวสาร</h2>
        </div>

        <div className="mx-auto flex flex-col items-center justify-center gap-4">
          <Image src={NotFoundImage} alt="Not Found" width={80} height={80} />

          <div className="flex flex-col items-center justify-center">
            <h5 className="text-base font-medium">ยังไม่มีข่าวสาร</h5>
            <p className="text-sm text-muted-foreground">
              ข่าวสารจะถูกแสดงที่นี่
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-3 rounded-md border-2 bg-background p-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-bold leading-7">ข่าวสาร</h2>
        <span className="text-xs font-medium text-muted-foreground">
          {items.length} รายการ
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const isExpanded = expandedId === item._id;
          const publishedLabel = item.publishedAt
            ? format(new Date(item.publishedAt), "d MMM yyyy", { locale: th })
            : null;

          return (
            <li
              key={item._id}
              className={cn(
                "overflow-hidden rounded-md border-2 border-border transition-colors",
                isExpanded && "border-pink/40 bg-pink/5",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId(isExpanded ? null : item._id)
                }
                className="flex w-full items-start p-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {item.isPinned && (
                          <PinIcon className="size-3 shrink-0 text-pink" />
                        )}
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      {item.summary && !isExpanded && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.summary}
                        </p>
                      )}
                    </div>
                    <ChevronDownIcon
                      className={cn(
                        "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </div>
                  {publishedLabel && (
                    <time className="mt-1 block text-[11px] text-muted-foreground">
                      {publishedLabel}
                    </time>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-3 pb-3 pt-2">
                  {item.summary && (
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {item.summary}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
};
