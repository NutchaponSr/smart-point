"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";

import { useCRPC } from "@/lib/convex/crpc";
import { useConfirm } from "@/hooks/use-confirm";
import { usePagination } from "@/hooks/use-pagination";

import { Button } from "@/components/ui/button";
import { Main } from "@/components/main";
import { Pagination } from "@/components/pagniation";
import { DataTable } from "@/components/data-table";
import { Navigations } from "@/components/navigations";
import { links } from "@/modules/dashboard/constants";

import { columns } from "@/modules/news/ui/components/news-columns";
import { useNewsFilters } from "@/modules/news/stores/use-news-filters";

export const NewsAnalyticView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useNewsFilters();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบข่าวสาร",
  });

  const debouncedQuery = useDebounce(filters.q, 400);

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: newsList } = useSuspenseQuery(
    crpc.news.getList.queryOptions({
      limit: filters.limit,
      cursor: requestCursor,
      q: debouncedQuery,
    }),
  );

  const canGoForward =
    newsList.hasNextPage && newsList.continueCursor != null;

  const bulkDelete = useMutation(crpc.news.bulkDelete.mutationOptions());

  const tableColumnDefs = useMemo(() => columns(), []);

  const table = useReactTable({
    data: newsList.page,
    columns: tableColumnDefs,
    getRowId: (row) => row._id,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  const onRemove = async () => {
    const ok = await confirm();
    if (ok) {
      bulkDelete.mutate({
        ids: table.getSelectedRowModel().rows.map((row) => row.original._id),
      });
    }
  };

  return (
    <Main
      title="ข่าวสาร"
      searchValue={filters.q}
      onSearchChange={(q) => setFilters({ ...filters, q })}
      newLink="/meta/news/new"
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
                  const c = newsList.continueCursor;
                  if (c != null) goForward(c);
                }}
              />
              {(table.getIsAllPageRowsSelected() ||
                table.getIsSomePageRowsSelected()) && (
                <Button
                  variant="dangerOutline"
                  onClick={onRemove}
                >
                  ลบ
                </Button>
              )}
            </div>

            <DataTable data={newsList.page} columns={columns()} />
          </div>
        </div>
      </section>
    </Main>
  );
};
