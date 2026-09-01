"use client";

import RubyIcon from "../../../../../public/ruby.svg";

import type { ApiOutputs } from "@convex/api";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BsCalendar2Fill,
  BsPeopleFill,
  BsCheckCircleFill,
} from "react-icons/bs";
import { useState } from "react";

import { useLocale } from "next-intl";

import { pickLocalized } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";
import { formatLocalizedDate } from "@/lib/format-thai-date";

import { usePagination } from "@/hooks/use-pagination";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagniation";

import {
  categories,
  buRestrictedCategories,
} from "@/modules/events/constants";
import { formatAllowedBuLabels } from "@/modules/events/utils/bu-labels";
import { useEventFilters } from "@/modules/events/stores/use-event-filters";
import { EventDetailDialog } from "@/modules/events/ui/components/event-detail-dialog";

type Event = ApiOutputs["activity"]["getMany"]["page"][number];

const categoryBadgeClassName: Record<Event["category"], string> = {
  external: "bg-[#ddf4ff] text-[#1899d6]",
  internal: "bg-[#d7ffb8] text-[#58a700]",
  internal_bu: "bg-[#f3e0ff] text-[#a568cc]",
  specials_point: "bg-[#ffe8c2] text-[#cc7800]",
};

export const AllEventsScreen = () => {
  const locale = useLocale();
  const crpc = useCRPC();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [filters, setFilters] = useEventFilters();

  const debouncedQuery = useDebounce(filters.q, 400);

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: events } = useSuspenseQuery(
    crpc.activity.getMany.queryOptions({
      q: debouncedQuery,
      limit: filters.limit,
      cursor: requestCursor,
      view: filters.view,
      minParticipants: filters.minParticipants,
      maxParticipants: filters.maxParticipants,
      eligibleOnly: true,
    }),
  );

  const canGoForward = events.hasNextPage && events.continueCursor != null;

  return (
    <section className="grid">
      <EventDetailDialog
        event={selectedEvent}
        open={selectedEvent != null}
        onOpenChange={(open) => {
          if (!open) setSelectedEvent(null);
        }}
      />
      <div className="flex items-center justify-between gap-4 mt-6 mb-3">
        <h2 className="text-xl font-extrabold">กิจกรรมที่เข้าร่วมได้</h2>
        <Pagination
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={goBack}
          onForward={() => {
            const c = events.continueCursor;
            if (c != null) goForward(c);
          }}
        />
      </div>

      {events.page.length === 0 ? (
        <div className="grid place-items-center gap-2 rounded-md border-2 border-dashed border-border bg-background p-10 text-center">
          <p className="text-lg font-bold">ไม่พบกิจกรรม</p>
          <p className="text-sm text-muted-foreground">
            ลองเปลี่ยนคำค้นหาหรือตัวกรองดูอีกครั้ง
          </p>
        </div>
      ) : (
        <ul>
          {events.page.map((event) => {
            const isFull =
              event.maxParticipants != null &&
              event.joinedCount >= event.maxParticipants;
            const joined = event.myStatus != null;

            return (
              <li
                key={String(event.id)}
                className="flex flex-col border-t-2 bg-background px-4 py-6 transition-colors hover:bg-[#fafafa] sm:flex-row sm:items-center gap-8"
              >
                <button
                  type="button"
                  className="grid min-w-0 flex-1 gap-1.5 text-left"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-1.5 text-xs font-bold",
                        categoryBadgeClassName[event.category],
                      )}
                    >
                      {categories[event.category].th}
                    </span>
                    <span className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[#cc348d] font-semibold">
                      <img src={RubyIcon.src} alt="คะแนนพิเศษ" className="size-5 fill-current" />
                      {event.point}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-bold break-all">
                    {pickLocalized(event.name, locale)}
                  </h3>
                  <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground whitespace-pre-wrap break-all">
                    {pickLocalized(event.description, locale)}
                  </p>
                  {buRestrictedCategories.includes(
                    event.category as (typeof buRestrictedCategories)[number],
                  ) && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formatAllowedBuLabels(
                        event.allowedDivisions,
                        event.allowedDepartments,
                      ).map((label) => (
                        <span
                          key={label}
                          className="rounded-md bg-[#f3e0ff] px-2 py-1 text-xs font-semibold text-[#a568cc]"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid max-w-md gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-md border-2 bg-[#f7f7f7] px-2.5 py-1.5 text-sm font-semibold text-[#4b4b4b]">
                        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#ddf4ff] text-[#1899d6]">
                          <BsCalendar2Fill className="size-3.5" />
                        </span>
                        <span>
                          {formatLocalizedDate(event.startDate, locale)}
                          {event.endDate
                            ? ` – ${formatLocalizedDate(event.endDate, locale)}`
                            : null}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-md border-2 bg-[#f7f7f7] px-2.5 py-1.5 text-sm font-semibold text-[#4b4b4b]">
                        <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#d7ffb8] text-[#58a700]">
                          <BsPeopleFill className="size-3.5" />
                        </span>
                        <span>
                          {event.maxParticipants
                            ? `${event.joinedCount} / ${event.maxParticipants}`
                            : `ไม่จำกัด`}
                        </span>
                      </span>
                    </div>
                    {event.maxParticipants ? (
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[#58cc02] transition-all"
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
                </button>

                <div className="shrink-0 sm:w-36 self-start mt-8">
                  {joined ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-[#d7ffb8] text-sm font-medium text-[#58a700] hover:bg-[#c6f5a7]"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <BsCheckCircleFill className="size-4" />
                      เข้าร่วมแล้ว
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant={isFull ? "locked" : "secondary"}
                      className="w-full tracking-wide"
                      disabled={isFull}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {isFull ? "เต็มแล้ว" : "เข้าร่วม"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
