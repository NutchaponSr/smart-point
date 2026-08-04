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

import { columns } from "@/modules/rewards/ui/components/reward-columns";
import { RewardFilters } from "@/modules/rewards/ui/components/reward-filters";

import { links } from "@/modules/dashboard/constants";
import { useRewardExcel } from "@/modules/rewards/hooks/use-reward-excel";
import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";
import { ExcelImportErrorsDialog } from "@/modules/rewards/ui/components/excel-import-errors-dialog";

export const RewardAnalyticView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useRewardFilters();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "ลบรางวัล",
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
  
  const { data: rewards } = useSuspenseQuery(crpc.reward.getList.queryOptions({
    limit: filters.limit,
    cursor: requestCursor,
    q: debouncedQuery,
    minCost: filters.minCost,
    maxCost: filters.maxCost,
    star: filters.star,
  }));

  const { onImport, onExport, errors, clearErrors } = useRewardExcel({
    searchQuery: debouncedQuery,
    minCost: filters.minCost,
    maxCost: filters.maxCost,
    star: filters.star,
  });

  const canGoForward = rewards.hasNextPage && rewards.continueCursor != null;

  const bulkDelete = useMutation(crpc.reward.bulkDelete.mutationOptions());

  const tableColumnDefs = useMemo(() => columns(), []);
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);

  const onRemove = async () => {
    const ok = await confirm();

    if (ok) {
      bulkDelete.mutate(
        { ids: selectedIds },
        { onSuccess: () => setRowSelection({}) },
      );
    }
  };

  return (
    <>
      <ExcelImportErrorsDialog errors={errors} onClose={clearErrors} />
      <Main
        title="รางวัล"
        onImport={onImport}
        onExport={onExport}
        searchValue={filters.q}
        onSearchChange={(q) => setFilters({ ...filters, q })}
        newLink="/meta/rewards/new"
        filter={<RewardFilters variant="popover" />}
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
                    const c = rewards.continueCursor;
                    if (c != null) goForward(c);
                  }}
                />
                {selectedIds.length > 0 && (
                  <Button
                    variant="danger"
                    onClick={onRemove}
                  >
                    ลบ
                  </Button>
                )}
              </div>

              <DataTable
                data={rewards.page}
                columns={tableColumnDefs}
                enableRowSelection
                getRowId={(row) => row._id}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            </div>
          </div>
        </section>
      </Main>
    </>
  );
}

