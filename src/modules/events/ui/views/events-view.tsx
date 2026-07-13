"use client";

import { RowSelectionState } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { useConfirm } from "@/hooks/use-confirm";
import { usePagination } from "@/hooks/use-pagination";

import { Button } from "@/components/ui/button";

import { Main } from "@/components/main";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";
import { Navigations } from "@/components/navigations";

import { columns } from "@/modules/events/ui/components/event-columns";
import { EventFiltersPopover } from "@/modules/events/ui/components/event-filters";

import { useEventExcel } from "@/modules/events/hooks/use-event-excel";
import { useEventFilters } from "@/modules/events/stores/use-event-filters";
import { links } from "@/modules/dashboard/constants";

export const EventsView = () => {
  const crpc = useCRPC(); 

  const [filters, setFilters] = useEventFilters();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบกิจกรรม",
  });

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
  
  const { data: events } = useSuspenseQuery(crpc.activity.getMany.queryOptions({
    q: debouncedQuery,
    limit: filters.limit,
    cursor: requestCursor,
    view: filters.view,
    minParticipants: filters.minParticipants,
    maxParticipants: filters.maxParticipants,
  }));
  const { onImport, onExport } = useEventExcel({
    searchQuery: debouncedQuery,
    view: filters.view,
    minParticipants: filters.minParticipants ?? null,
    maxParticipants: filters.maxParticipants ?? null,
  });
  
  const canGoForward = events.hasNextPage && events.continueCursor != null;

  const bulkDelete = useMutation(crpc.activity.bulkDelete.mutationOptions());

  const tableColumnDefs = useMemo(() => columns(), []);
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedEvents = events.page.filter((event) =>
    selectedIds.includes(event.id),
  );
  const canDeleteSelection =
    selectedEvents.length > 0 &&
    selectedEvents.every((event) => {
      const hasEnded =
        event.endDate != null && new Date(event.endDate).getTime() < Date.now();
      return event.joinedCount <= 0 || hasEnded;
    });

  const onRemove = async () => {
    if (!canDeleteSelection) return;

    const ok = await confirm();
    if (ok) {
      bulkDelete.mutate(
        { activityIds: selectedIds },
        { onSuccess: () => setRowSelection({}) },
      );
    }
  };

  return (
    <Main
      title="กิจกรรม"
      onImport={onImport}
      onExport={onExport}
      searchValue={filters.q}
      onSearchChange={(q) => setFilters({ ...filters, q })}
      newLink="/meta/events/new"
      filter={<EventFiltersPopover />}
      menu={<Navigations links={links} />}
    >
      <ConfirmationDialog />
      <section className="p-4 md:p-8">
        <div className="grid gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Pagination
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={() => {
                  const c = events.continueCursor;
                  if (c != null) goForward(c);
                }}
              />
              {selectedIds.length > 0 && (
                <Button
                  variant="danger"
                  disabled={bulkDelete.isPending || !canDeleteSelection}
                  title={
                    canDeleteSelection
                      ? undefined
                      : "มีพนักงานเข้าร่วมอยู่ — ลบได้หลังกิจกรรมสิ้นสุด"
                  }
                  onClick={onRemove}
                >
                  ลบ
                </Button>
              )}
            </div>
            
            <DataTable
              data={events.page}
              columns={tableColumnDefs}
              enableRowSelection
              getRowId={(row) => row.id}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          </div>
        </div>
      </section>
    </Main>
  );
};
