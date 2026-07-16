"use client";

import Link from "next/link";

import CoinIcon from "../../../../../public/coin.svg";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ApiOutputs } from "@convex/api";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";

import { Button } from "@/components/ui/button";

import {
  categories,
  buRestrictedCategories,
  ENABLE_BU_RECOMMENDED,
  getCarouselNow,
} from "@/modules/events/constants";
import { formatAllowedBuLabels } from "@/modules/events/utils/bu-labels";

type RecommendedEvent =
  ApiOutputs["activity"]["recommended"]["items"][number];

const cardPalette = [
  {
    banner: "bg-[#58cc02]",
    border: "border-[#46a302]",
    soft: "bg-[#d7ffb8] text-[#58a700]",
  },
  {
    banner: "bg-[#1cb0f6]",
    border: "border-[#1899d6]",
    soft: "bg-[#ddf4ff] text-[#1899d6]",
  },
  {
    banner: "bg-[#ce82ff]",
    border: "border-[#a568cc]",
    soft: "bg-[#f3e0ff] text-[#a568cc]",
  },
  {
    banner: "bg-[#ff9600]",
    border: "border-[#cc7800]",
    soft: "bg-[#ffe8c2] text-[#cc7800]",
  },
] as const;

const CAROUSEL_LIMIT = 10;
const AUTO_PLAY_MS = 5000;

interface Props {
  autoLoop?: boolean;
}

export const EventCarousel = ({
  autoLoop = false,
}: Props) => {
  const crpc = useCRPC();
  const queryClient = useQueryClient();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const updateEdges = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    setAtStart(node.scrollLeft <= 1);
    setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateEdges();
    const node = scrollerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(node);
    return () => observer.disconnect();
  }, [updateEdges]);

  const { data } = useSuspenseQuery(
    crpc.activity.recommended.queryOptions({
      limit: CAROUSEL_LIMIT,
      now: getCarouselNow(),
    }),
  );

  const join = useMutation(crpc.activity.join.mutationOptions());

  const [ConfirmationDialog, confirm] = useConfirm({
    title: "เข้าร่วมกิจกรรม",
  });

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const node = scrollerRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-carousel-card]");
    const step = card ? card.offsetWidth + 16 : 320;
    node.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  const scrollPrev = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;

    if (node.scrollLeft <= 1 && autoLoop) {
      node.scrollTo({
        left: node.scrollWidth - node.clientWidth,
        behavior: "smooth",
      });
      return;
    }

    scrollByCard(-1);
  }, [autoLoop, scrollByCard]);

  const scrollNext = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;

    const reachedEnd =
      node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;

    if (reachedEnd && autoLoop) {
      node.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }

    scrollByCard(1);
  }, [autoLoop, scrollByCard]);

  useEffect(() => {
    if (!autoLoop || data.items.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      scrollNext();
    }, AUTO_PLAY_MS);

    return () => clearInterval(timer);
  }, [autoLoop, data.items.length, isPaused, scrollNext]);

  const onJoin = async (event: RecommendedEvent) => {
    const ok = await confirm();
    if (!ok) return;

    join.mutate(
      { activityId: String(event.id) },
      {
        onSuccess: () => {
          toast.success(`เข้าร่วม "${event.name}" เรียบร้อย`);
          queryClient.invalidateQueries({
            queryKey: crpc.activity.recommended.queryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: crpc.activity.list.queryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: crpc.activity.getMany.queryKey(),
          });
        },
        onError: (error) => {
          toast.error(error.message || "เข้าร่วมกิจกรรมไม่สำเร็จ");
        },
      },
    );
  };

  const canScroll = !atStart || !atEnd;
  const showPrev = canScroll && (autoLoop || !atStart);
  const showNext = canScroll && (autoLoop || !atEnd);

  return (
    <section
      className="grid w-full min-w-0 gap-4"
      onMouseEnter={autoLoop ? () => setIsPaused(true) : undefined}
      onMouseLeave={autoLoop ? () => setIsPaused(false) : undefined}
      onFocusCapture={autoLoop ? () => setIsPaused(true) : undefined}
      onBlurCapture={
        autoLoop
          ? (event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsPaused(false);
              }
            }
          : undefined
      }
    >
      <ConfirmationDialog />
      {data.items.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-md border-2 border-dashed border-border bg-background p-10 text-center">
          <p className="text-lg font-bold">
            {ENABLE_BU_RECOMMENDED
              ? "ยังไม่มีกิจกรรมเฉพาะ BU ของคุณ"
              : "ยังไม่มีกิจกรรมแนะนำ"}
          </p>
          <p className="text-sm text-muted-foreground">
            {ENABLE_BU_RECOMMENDED
              ? "กิจกรรมที่เปิดทุก BU หรือกิจกรรมอื่น ๆ ดูได้ที่รายการด้านล่าง"
              : "กิจกรรมอื่น ๆ ดูได้ที่รายการด้านล่าง"}
          </p>
        </div>
      ) : (
        <div className="relative w-full min-w-0">
          <button
            type="button"
            aria-label="เลื่อนไปก่อนหน้า"
            onClick={scrollPrev}
            className={cn(
              "absolute top-1/2 -left-10 z-10 -translate-y-1/2 transition-opacity h-full px-2 flex items-center justify-center",
              !showPrev && "hidden",
            )}
          >
            <ChevronLeftIcon className="size-8" />
          </button>
          <button
            type="button"
            aria-label="เลื่อนไปถัดไป"
            onClick={scrollNext}
            className={cn(
              "absolute top-1/2 -right-10 z-10 -translate-y-1/2 transition-opacity px-2 flex items-center justify-center",
              !showNext && "hidden",
            )}
          >
            <ChevronRightIcon className="size-8" />
          </button>
          <div
            ref={scrollerRef}
            onScroll={updateEdges}
            className={cn(
              "flex w-full min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              !atStart &&
                !atEnd &&
                "mask-[linear-gradient(to_right,transparent_0px,black_24px,black_calc(100%-24px),transparent_100%)]",
              atStart &&
                !atEnd &&
                "mask-[linear-gradient(to_right,black_calc(100%-24px),transparent_100%)]",
              !atStart &&
                atEnd &&
                "mask-[linear-gradient(to_right,transparent_0px,black_24px)]",
            )}
          >
          {data.items.map((event, index) => {
            const palette = cardPalette[index % cardPalette.length];
            const isFull =
              event.maxParticipants != null &&
              event.joinedCount >= event.maxParticipants;
            const joined = event.myStatus != null;

            return (
              <article
                key={String(event.id)}
                data-carousel-card
                className={cn(
                  "flex w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-md border-2 bg-background sm:w-[300px]",
                  palette.border,
                )}
              >
                <div
                  className={cn(
                    "flex items-start justify-between gap-2 p-4 text-white",
                    palette.banner,
                  )}
                >
                  <div className="grid gap-1">
                    <span className="text-xs font-bold uppercase tracking-wide text-white/80">
                      {categories[event.category].th}
                    </span>
                    <h3 className="line-clamp-2 text-lg font-extrabold leading-snug">
                      {event.name}
                    </h3>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-md bg-white/20 px-2 py-1.5 text-sm font-extrabold">
                    <img src={CoinIcon.src} alt="Coin" className="size-5 fill-current" />
                    {event.point}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                    {event.description || "ไม่มีรายละเอียดกิจกรรม"}
                  </p>

                  {buRestrictedCategories.includes(
                    event.category as (typeof buRestrictedCategories)[number],
                  ) && (
                    <div className="flex flex-wrap gap-1.5">
                      {formatAllowedBuLabels(
                        event.allowedDivisions,
                        event.allowedDepartments,
                      ).map((label) => (
                        <span
                          key={label}
                          className={cn(
                            "rounded-md px-2 py-1 text-[11px] font-bold",
                            palette.soft,
                          )}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CalendarIcon className="size-4 shrink-0" />
                    {format(event.startDate, "dd LLL yyyy")}
                    {event.endDate
                      ? ` - ${format(event.endDate, "dd LLL yyyy")}`
                      : null}
                  </div>

                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <UsersIcon className="size-4" />
                        ผู้เข้าร่วม
                      </span>
                      <span className={cn("rounded-lg px-2 py-0.5 text-xs font-bold", palette.soft)}>
                        {event.maxParticipants
                          ? `${event.joinedCount} / ${event.maxParticipants}`
                          : `${event.joinedCount} คน (ไม่จำกัด)`}
                      </span>
                    </div>
                    {event.maxParticipants ? (
                      <div className="h-4 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full transition-all", palette.banner)}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (event.joinedCount / event.maxParticipants) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-auto pt-1">
                    {joined ? (
                      <div className="flex h-11 items-center justify-center gap-2 rounded-md bg-[#d7ffb8] text-base font-medium text-[#58a700]">
                        <CheckCircle2Icon className="size-5" />
                        เข้าร่วมแล้ว
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant={isFull ? "locked" : "default"}
                        className="w-full tracking-wide"
                        disabled={isFull || join.isPending}
                        onClick={() => onJoin(event)}
                      >
                        {isFull ? "เต็มแล้ว" : "เข้าร่วม"}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        </div>
      )}
    </section>
  );
};
