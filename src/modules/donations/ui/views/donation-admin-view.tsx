"use client";

import { useMemo } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Main } from "@/components/main";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";
import { Navigations } from "@/components/navigations";

import { links } from "@/modules/dashboard/constants";
import { useDonationExcel } from "@/modules/donations/hooks/use-donation-excel";
import { useDonationAdminFilters } from "@/modules/donations/stores/use-donation-admin-filters";
import { donationColumns } from "@/modules/donations/ui/components/donation-columns";
import { DonationFilters } from "@/modules/donations/ui/components/donation-filters";

export const DonationAdminView = () => {
  const crpc = useCRPC();
  const [filters, setFilters] = useDonationAdminFilters();

  const debouncedQuery = useDebounce(filters.q, 400);
  const debouncedMin = useDebounce(filters.min, 400);
  const debouncedMax = useDebounce(filters.max, 400);

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery: `${debouncedQuery}|${debouncedMin}|${debouncedMax}|${filters.from ?? ""}|${filters.to ?? ""}`,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: donations } = useSuspenseQuery(
    crpc.donation.getManyAdmin.queryOptions({
      q: debouncedQuery,
      min: debouncedMin,
      max: debouncedMax,
      from: filters.from,
      to: filters.to,
      limit: filters.limit,
      cursor: requestCursor,
    }),
  );

  const tableColumns = useMemo(() => donationColumns(), []);

  const canGoForward =
    donations.hasNextPage && donations.continueCursor != null;

  const { onExport } = useDonationExcel({
    q: debouncedQuery,
    min: debouncedMin,
    max: debouncedMax,
    from: filters.from,
    to: filters.to,
  });

  return (
    <Main
      title="บริจาค"
      menu={<Navigations links={links} />}
      onExport={onExport}
    >
      <section className="space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_4fr]">
          <DonationFilters total={donations.page.length} />

          <div className="w-full space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Pagination
                canGoBack={canGoBack}
                canGoForward={canGoForward}
                onBack={goBack}
                onForward={() => {
                  const c = donations.continueCursor;
                  if (c != null) goForward(c);
                }}
              />
            </div>

            {donations.page.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border py-16">
                <p className="text-lg font-bold text-[#4b4b4b]">
                  ไม่พบรายการบริจาค
                </p>
                <p className="text-sm text-muted-foreground">
                  ลองปรับตัวกรองหรือค้นหาใหม่
                </p>
              </div>
            ) : (
              <DataTable data={donations.page} columns={tableColumns} />
            )}
          </div>
        </div>
      </section>
    </Main>
  );
};
