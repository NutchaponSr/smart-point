"use client";

import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import { Main } from "@/components/main";
import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";

import { columns } from "@/modules/employee/ui/components/employee-columns";

import { useEmployeeExcel } from "@/modules/employee/hooks/use-employee-excel";
import { useEmployeeFilters } from "@/modules/employee/stores/use-employee-filters";
import { ExcelImportErrorsDialog } from "@/modules/employee/ui/components/excel-import-errors-dialog";
import { Navigations } from "@/components/navigations";
import { links } from "@/modules/dashboard/constants";

export const EmployeeAnalyticView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useEmployeeFilters();
  
  const debouncedQuery = useDebounce(filters.q, 400);
  
  const { 
    requestCursor, 
    canGoBack, 
    goBack, 
    goForward 
  } = usePagination({
    debouncedQuery,
    limit: filters.limit,
    urlPage: filters.page,
    onPageChange: (page) => setFilters({ ...filters, page }),
  });
  
  const { data: employees } = useSuspenseQuery(crpc.employee.getMany.queryOptions({
    limit: filters.limit,
    cursor: requestCursor,
    query: debouncedQuery,
  }));

  const { onImport, onExport, errors, clearErrors } = useEmployeeExcel({
    searchQuery: debouncedQuery,
  });

  const canGoForward = employees.hasNextPage && employees.continueCursor != null;

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
      menu={<Navigations links={links} />}
    >
      <section className="p-4 md:p-8">
        <div className="grid gap-12">
          <div className="flex flex-col gap-4">
            <Pagination
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onBack={goBack}
              onForward={() => {
                const c = employees.continueCursor;
                if (c != null) goForward(c);
              }}
            />

            <DataTable data={employees.page} columns={columns()} />
          </div>
        </div>
      </section>
    </Main>
    </>
  );
};
