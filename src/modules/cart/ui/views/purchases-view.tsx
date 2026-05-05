"use client";

import { useTranslations } from "next-intl";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Main } from "@/components/main";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";

import { purchaseColumns } from "@/modules/cart/ui/components/purchase-columns";
import { PurchaseFilters } from "@/modules/cart/ui/components/purchase-filters";

import { usePurchaseFilters } from "@/modules/cart/stores/use-purchase-filters";

export const PurchasesView = () => {
  const crpc = useCRPC();
  const t = useTranslations("purchases");
  
  const [filters, setFilters] = usePurchaseFilters();

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

  const { data: purchases } = useSuspenseQuery(crpc.redemption.getMany.queryOptions({
    q: debouncedQuery,
    limit: filters.limit,
    sort: filters.sort,
    from: filters.from,
    to: filters.to,
    cursor: requestCursor,
  }));

  const canGoForward = purchases.hasNextPage && purchases.continueCursor != null;

  return (
    <Main title={t("title")}>
      <section className="space-y-4 p-4 md:p-8">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-8 lg:grid-cols-[1fr_4fr]">
          <div className="grid divide-y-2 divide-solid divide-border rounded-xs border-2 border-border bg-background overflow-y-auto lg:sticky lg:inset-y-4 lg:max-h-[calc(100vh-2rem)]">
            <PurchaseFilters total={purchases.page.length} />
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-2 grow">
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

            <DataTable data={purchases.page} columns={purchaseColumns()} />
          </div>
        </div>
      </section>
    </Main>
  );
};
