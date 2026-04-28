"use client";

import Link from "next/link";

import { useMemo, useState } from "react";
import { GoSearch } from "react-icons/go";
import { useDebounce } from "@uidotdev/usehooks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { useCRPC } from "@/lib/convex/crpc";

import { usePagination } from "@/hooks/use-pagination";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { DataTable } from "@/components/data-table";
import { Pagination } from "@/components/pagniation";
import { Navigations } from "@/components/navigations";
import { SearchInput } from "@/components/search-input";
import { ExcelDropdown } from "@/components/excel-dropdown";

import { columns } from "@/modules/employee/ui/components/employee-columns";

import { links } from "@/modules/dashboard/constants";

import { useEmployeeExcel } from "@/modules/employee/hooks/use-employee-excel";
import { useEmployeeFilters } from "@/modules/employee/stores/use-employee-filters";

export const EmployeeAnalyticView = () => {
  const crpc = useCRPC();

  const [filters, setFilters] = useEmployeeFilters();
  const [rowSelection, setRowSelection] = useState({});
  
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
  const { errors, onImport, onExport } = useEmployeeExcel();

  const { data: employees } = useSuspenseQuery(crpc.employee.getMany.queryOptions({
    limit: filters.limit,
    cursor: requestCursor,
    query: debouncedQuery,
  }));

  const canGoForward = employees.hasNextPage && employees.continueCursor != null;

  const tableColumnDefs = useMemo(() => columns(), []);
  const dataTableKey = useMemo(
    () => employees.page.map((e) => e.employeeId).join(","),
    [employees.page],
  );

  const table = useReactTable({
    data: employees.page,
    columns: tableColumnDefs,
    getRowId: (row) => row.employeeId,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  return (
    <>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[142.5px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">พนักงาน</h1>

          <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="elevated" size="iconLg">
                  <GoSearch className="size-5 stroke-[0.25]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-4">
                <SearchInput
                  value={filters.q}
                  onChange={(q) => setFilters({ ...filters, q })}
                />
              </PopoverContent>
            </Popover>
            <ExcelDropdown
              onImport={onImport}
              onExport={onExport}
            />
            <Link href="/dashboard/employee/new">
              <Button variant="elevated" className="bg-pink">
                เพิ่มพนักงาน
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto grow">
          <Link href="/dashboard">
            <Button variant="rounded" size="smRounded">
              ภาพรวม
            </Button>
          </Link>
          <Navigations links={links} />
        </div>
      </header>

      <section className="p-4 md:p-8">
        <div className="grid gap-12">
          <div className="flex flex-col gap-4">
            <small className="text-destructive">{errors.map((error) => error.message).join(", ")}</small>
            <Pagination
              canGoBack={canGoBack}
              canGoForward={canGoForward}
              onBack={goBack}
              onForward={() => {
                const c = employees.continueCursor;
                if (c != null) goForward(c);
              }}
            />
            <DataTable key={dataTableKey} table={table} />
          </div>
        </div>
      </section>
    </>
  );
};
