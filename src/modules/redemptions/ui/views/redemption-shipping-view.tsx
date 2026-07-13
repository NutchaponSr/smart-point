"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Main } from "@/components/main";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";
import { Navigations } from "@/components/navigations";

import { links } from "@/modules/dashboard/constants";
import { useRedemptionAdminFilters } from "@/modules/redemptions/stores/use-redemption-admin-filters";
import { RedemptionShippingFilters } from "@/modules/redemptions/ui/components/redemption-shipping-filters";
import {
  redemptionShippingColumns,
  type RedemptionAdminRow,
} from "@/modules/redemptions/ui/components/redemption-shipping-columns";
import { UpdateShippingDialog } from "@/modules/redemptions/ui/components/update-shipping-dialog";

export const RedemptionShippingView = () => {
  const crpc = useCRPC();
  const [filters, setFilters] = useRedemptionAdminFilters();

  const debouncedQuery = useDebounce(filters.q, 400);
  const debouncedBy = useDebounce(filters.by ?? "", 400);

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery: `${debouncedQuery}|${debouncedBy}|${filters.shippingStatus?.join(",") ?? ""}|${filters.status?.join(",") ?? ""}`,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: redemptions } = useSuspenseQuery(
    crpc.redemption.getManyAdmin.queryOptions({
      q: debouncedQuery,
      shippingStatus: filters.shippingStatus,
      status: filters.status,
      sort: filters.sort,
      from: filters.from,
      to: filters.to,
      by: debouncedBy.trim() === "" ? null : debouncedBy,
      limit: filters.limit,
      cursor: requestCursor,
    }),
  );

  const [selectedRow, setSelectedRow] = useState<RedemptionAdminRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tableColumns = useMemo(
    () =>
      redemptionShippingColumns({
        onUpdate: (row) => {
          setSelectedRow(row);
          setDialogOpen(true);
        },
      }),
    [],
  );

  const canGoForward =
    redemptions.hasNextPage && redemptions.continueCursor != null;

  return (
    <Main title="จัดส่งรางวัล" menu={<Navigations links={links} />}>
      <UpdateShippingDialog
        row={selectedRow}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <section className="space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
          <RedemptionShippingFilters total={redemptions.page.length} />

          <div className="w-full">
            <header className="relative mb-4 overflow-hidden rounded-md border-2 border-[#0003] bg-[#58cc02] p-4">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                รายการจัดส่งรางวัล
              </h2>
              <p className="mt-1 text-sm font-medium text-white/90">
                อัปเดตสถานะการจัดส่งและเลขพัสดุให้พนักงานติดตามได้ทันที
              </p>
            </header>

            <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
              <Pagination
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={() => {
                  const c = redemptions.continueCursor;
                  if (c != null) goForward(c);
                }}
              />
            </div>

            {redemptions.page.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border py-16">
                <p className="text-lg font-bold text-[#4b4b4b]">
                  ไม่พบรายการจัดส่ง
                </p>
                <p className="text-sm text-muted-foreground">
                  ลองปรับตัวกรองหรือค้นหาใหม่
                </p>
              </div>
            ) : (
              <DataTable
                data={redemptions.page}
                columns={tableColumns}
              />
            )}
          </div>
        </div>
      </section>
    </Main>
  );
};
