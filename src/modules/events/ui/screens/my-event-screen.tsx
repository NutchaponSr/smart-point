"use client";

import RubyIcon from "../../../../../public/ruby.svg";

import type { ApiOutputs } from "@convex/api";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BsCalendar2Fill,
  BsCheckCircleFill,
} from "react-icons/bs";
import { useState } from "react";

import { useLocale } from "next-intl";

import { pickLocalized } from "@/lib/i18n/localized";
import { formatLocalizedDate } from "@/lib/format-thai-date";
import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Pagination } from "@/components/pagniation";
import { Button } from "@/components/ui/button";

import { AttachButton } from "@/modules/events/ui/components/attach-button";
import { EventDetailDialog } from "@/modules/events/ui/components/event-detail-dialog";

import { categories, statuses } from "@/modules/events/constants";
import { useEventFilters } from "@/modules/events/stores/use-event-filters";

type MyEvent = ApiOutputs["activity"]["list"]["page"][number];
type ParticipationStatus = keyof typeof statuses;

const categoryBadgeClassName: Record<MyEvent["category"], string> = {
  external: "bg-[#ddf4ff] text-[#1899d6]",
  internal: "bg-[#d7ffb8] text-[#58a700]",
  internal_bu: "bg-[#f3e0ff] text-[#a568cc]",
  specials_point: "bg-[#ffe8c2] text-[#cc7800]",
};

const statusBadgeClassName: Record<ParticipationStatus, string> = {
  registered: "bg-[#ddf4ff] text-[#1899d6]",
  attended: "bg-[#ffe8c2] text-[#cc7800]",
  rewarded: "bg-[#d7ffb8] text-[#58a700]",
};

const statusActionClassName =
  "flex h-10 items-center justify-center gap-1.5 rounded-md text-sm font-medium";

export const MyEventScreen = () => {
  const locale = useLocale();
  const crpc = useCRPC();
  const [selectedEvent, setSelectedEvent] = useState<MyEvent | null>(null);

  const [filters, setFilters] = useEventFilters();

  const debouncedQuery = useDebounce(filters.q, 400);

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: events } = useSuspenseQuery(
    crpc.activity.list.queryOptions({
      q: debouncedQuery,
      limit: filters.limit,
      cursor: requestCursor,
      view: filters.view,
      status: filters.status,
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
        <h2 className="text-xl font-extrabold">เข้าร่วมแล้ว</h2>
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
          <p className="text-lg font-bold">คุณยังไม่ได้เข้าร่วมกิจกรรม</p>
          <p className="text-sm text-muted-foreground">
            เลือกเข้าร่วมกิจกรรมจากรายการด้านบนเพื่อสะสมแต้ม
          </p>
        </div>
      ) : (
        <ul>
          {events.page.map((event) => {
            const participationStatus = event.myParticipation
              .status as ParticipationStatus;
            const statusLabel =
              participationStatus in statuses
                ? statuses[participationStatus].th
                : participationStatus;
            const hasEvidence = !!event.myParticipation.evidenceFileName;
            const canAttach = !hasEvidence && participationStatus === "registered";
            const points =
              event.myParticipation.pointAwarded ?? event.point;

            return (
              <li
                key={String(event.myParticipation.participantId)}
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
                    <span
                      className={cn(
                        "rounded-md px-2 py-1.5 text-xs font-bold",
                        statusBadgeClassName[participationStatus] ??
                          "bg-muted text-muted-foreground",
                      )}
                    >
                      {statusLabel}
                    </span>
                    <span className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[#cc348d] font-semibold">
                      <img
                        src={RubyIcon.src}
                        alt="คะแนนพิเศษ"
                        className="size-5 fill-current"
                      />
                      {points}
                    </span>
                  </div>
                  <h3 className="truncate text-base font-bold break-all">
                    {pickLocalized(event.name, locale)}
                  </h3>
                  <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground whitespace-pre-wrap break-all">
                    {pickLocalized(event.description, locale)}
                  </p>
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
                    </div>
                  </div>
                </button>

                <div className="shrink-0 sm:w-36 self-start mt-8">
                  {canAttach ? (
                    <AttachButton event={event} />
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        statusActionClassName,
                        "w-full",
                        statusBadgeClassName[participationStatus] ??
                          "bg-muted text-muted-foreground",
                      )}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <BsCheckCircleFill className="size-4" />
                      {statusLabel}
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
