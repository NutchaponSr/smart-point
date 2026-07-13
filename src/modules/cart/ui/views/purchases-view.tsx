"use client";

import Link from "next/link";
import { useMemo } from "react";

import emptyIllustration from "../../../../../public/extra_character_e.svg";

import { useTranslations } from "next-intl";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Button } from "@/components/ui/button";

import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";

import { Currencies } from "@/modules/cart/ui/components/currency";
import { purchaseColumns } from "@/modules/cart/ui/components/purchase-columns";
import { PurchaseFilters } from "@/modules/cart/ui/components/purchase-filters";

import { usePurchaseFilters } from "@/modules/cart/stores/use-purchase-filters";

export const PurchasesView = () => {
  const crpc = useCRPC();
  const t = useTranslations("purchases");

  const [filters, setFilters] = usePurchaseFilters();

  const debouncedQuery = useDebounce(filters.q, 400);

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });

  const { data: purchases } = useSuspenseQuery(
    crpc.redemption.getMany.queryOptions({
      q: debouncedQuery,
      limit: filters.limit,
      sort: filters.sort,
      from: filters.from,
      to: filters.to,
      cursor: requestCursor,
    }),
  );

  const canGoForward =
    purchases.hasNextPage && purchases.continueCursor != null;

  const tableColumns = useMemo(() => purchaseColumns(), []);

  const illustrationSrc =
    typeof emptyIllustration === "string"
      ? emptyIllustration
      : emptyIllustration.src;

  return (
    <div className="flex flex-col gap-6 px-6">
      <div className="flex flex-col gap-6 lg:flex-row-reverse lg:gap-12">
        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:z-1 lg:w-[368px] lg:shrink-0 lg:self-start">
          <div className="mb-2 flex h-11 flex-row items-center justify-between">
            <Currencies />
          </div>

          <PurchaseFilters total={purchases.page.length} />
        </aside>

        <div className="z-0 min-w-0 flex-1">
          <div className="grid gap-6 py-0 lg:py-6">
            <header className="relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 overflow-hidden rounded-md border-2 border-[#0003] bg-[#58cc02] p-4">
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                {t("title")}
              </h1>
            </header>

            {purchases.page.length > 0 && (
              <div className="flex items-center justify-between gap-4">
                <Pagination
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                  onBack={goBack}
                  onForward={() => {
                    const c = purchases.continueCursor;
                    if (c != null) goForward(c);
                  }}
                />
              </div>
            )}

            {purchases.page.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-border py-16">
                <img src={illustrationSrc} alt="" className="size-20" />

                <div className="text-center">
                  <p className="text-lg font-bold">ยังไม่มีประวัติการแลก</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ลองปรับตัวกรอง หรือไปที่ร้านค้าเพื่อแลกรางวัล
                  </p>
                </div>

                <Link href="/rewards">
                  <Button variant="primaryOutline" size="lg">
                    ไปที่ร้านค้า
                  </Button>
                </Link>
              </div>
            ) : (
              <DataTable data={purchases.page} columns={tableColumns} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
