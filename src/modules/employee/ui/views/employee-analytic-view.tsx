"use client";

import { useCallback } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Main } from "@/components/main";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";

import { columns } from "@/modules/employee/ui/components/employee-columns";
import { EmployeeFilters } from "@/modules/employee/ui/components/employee-filters";

import { useEmployeeExcel } from "@/modules/employee/hooks/use-employee-excel";
import { useEmployeeFilters } from "@/modules/employee/stores/use-employee-filters";
import { ExcelImportErrorsDialog } from "@/modules/employee/ui/components/excel-import-errors-dialog";
import { Navigations } from "@/components/navigations";
import { links } from "@/modules/dashboard/constants";

export const EmployeeAnalyticView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useEmployeeFilters();

  const debouncedQuery = useDebounce(filters.q, 400);
  const filterResetKey = [
    filters.division.join(","),
    filters.department.join(","),
    filters.rank.join(","),
  ].join("|");

  const onPageChange = useCallback(
    (page: number) => {
      void setFilters({ page });
    },
    [setFilters],
  );

  const { requestCursor, canGoBack, goBack, goForward } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange,
    resetKey: filterResetKey,
  });

  const { data: employees } = useSuspenseQuery(
    crpc.employee.getMany.queryOptions({
      limit: filters.limit,
      cursor: requestCursor,
      query: debouncedQuery,
      division: filters.division.length > 0 ? filters.division : null,
      department: filters.department.length > 0 ? filters.department : null,
      rank: filters.rank.length > 0 ? filters.rank : null,
    }),
  );

  const { onImport, onExport, errors, clearErrors } = useEmployeeExcel({
    searchQuery: debouncedQuery,
    division: filters.division,
    department: filters.department,
    rank: filters.rank,
  });

  const canGoForward =
    employees.hasNextPage && employees.continueCursor != null;

  return (
    <>
      <ExcelImportErrorsDialog errors={errors} onClose={clearErrors} />
      <Main
        title="พนักงาน"
        onImport={onImport}
        onExport={onExport}
        searchValue={filters.q}
        onSearchChange={(q) => setFilters({ ...filters, q })}
        newLink="/meta/employees/new"
        filter={<EmployeeFilters variant="popover" />}
        menu={<Navigations links={links} />}
      >
        <section className="p-4 md:p-8">
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-[#4b4b4b]">
                    ทั้งหมด
                  </h3>
                  <span className="inline-flex min-h-8 items-center text-sm font-bold text-[#1cb0f6]">
                    {employees.page.length} รายการ
                  </span>
                </div>
                <Pagination
                  canGoBack={canGoBack}
                  canGoForward={canGoForward}
                  onBack={goBack}
                  onForward={() => {
                    const c = employees.continueCursor;
                    if (c != null) goForward(c);
                  }}
                />
              </div>

              <DataTable data={employees.page} columns={columns()} />
            </div>
          </div>
        </section>
      </Main>
    </>
  );
};
