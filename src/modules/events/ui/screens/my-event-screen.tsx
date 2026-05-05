import { format } from "date-fns";
import { useTranslations } from "next-intl";
import type { ApiOutputs } from "@convex/api";
import { useDebounce } from "@uidotdev/usehooks";
import type { ColumnDef } from "@tanstack/react-table";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";

import { AttachButton } from "@/modules/events/ui/components/attach-button";
import { EventFilters } from "@/modules/events/ui/components/event-filters";

import { categories, statuses } from "@/modules/events/constants";
import { useEventFilters } from "@/modules/events/stores/use-event-filters";

export const MyEventScreen = () => {
  const crpc = useCRPC();
  const t = useTranslations("events");

  const [filters, setFilters] = useEventFilters();

  const debouncedQuery = useDebounce(filters.q, 400);

  const { 
    requestCursor, 
    canGoBack, 
    goBack, 
    goForward,
  } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: events } = useSuspenseQuery(crpc.activity.list.queryOptions({
    q: debouncedQuery,
    limit: filters.limit,
    cursor: requestCursor,
    view: filters.view,
    status: filters.status,
  }));
  
  const canGoForward = events.hasNextPage && events.continueCursor != null;

  return (
    <section className="space-y-4 p-4 md:p-8">
      <h2 className="text-xl">{t("my-events.title")}</h2>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
        <EventFilters />
        <div className="w-full">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 grow">
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
          </div>
          
          <DataTable data={events.page} columns={columns()} />
        </div>
      </div>
    </section>
  );
}

type Event = ApiOutputs["activity"]["list"]["page"][0];

const columns = (): ColumnDef<Event>[] => {
  return [
    {
      accessorKey: "name",
      header: "กิจกรรม",
    },
    {
      accessorKey: "category",
      header: "ประเภท",
      cell: ({ row }) => (
        <span className="text-base font-normal">{categories[row.original.category].th}</span>
      ),
    },
    {
      accessorKey: "startDate",
      header: "วันที่เริ่ม",
      cell: ({ row }) => (
        <span className="text-base font-normal">{format(row.original.startDate, "LLL dd, yyyy")}</span>
      ),
    },
    {
      accessorKey: "endDate",
      header: "วันที่สิ้นสุด",
      cell: ({ row }) => (
        <span className="text-base font-normal">{format(row.original.endDate || new Date(), "LLL dd, yyyy")}</span>
      ),
    },
    {
      id: "status",
      header: "สถานะ",
      cell: ({ row }) => {
        const participationStatus = row.original.myParticipation.status;
        const status =
          participationStatus in statuses
            ? statuses[participationStatus as keyof typeof statuses]
            : null;

        return (
          <div className="flex items-center justify-between">
            <span className="text-base font-normal">
              {status?.th ?? participationStatus}
            </span>
            {status?.en === "Registered" && <AttachButton event={row.original} />}
          </div>
        )
      } 
    },
  ]
}