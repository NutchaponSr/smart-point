"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import { SearchInput } from "./search-input";
import { ExcelDropdown } from "./excel-dropdown";

import { cn } from "@/lib/utils";

interface Props {
  title: string;
  children: React.ReactNode;
  onImport?: (file: File) => Promise<void>;
  onExport?: () => Promise<void>;
  filter?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  newLink?: string;
  menu?: React.ReactNode;
}

export const Main = ({
  title,
  children,
  onImport,
  onExport,
  filter,
  searchValue,
  onSearchChange,
  newLink,
  menu,
}: Props) => {
  return (
    <>
      <header className={cn("flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-2 h-[82px]", !!menu && "h-[142px]")}>
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl sm:block!">{title}</h1>

          <div className="flex items-center -my-2 gap-2">
            {searchValue !== undefined && onSearchChange && (
              <SearchInput
                variant="popover"
                value={searchValue}
                onChange={onSearchChange}
              />
            )}
            {filter}
            {(onImport || onExport) && (
              <ExcelDropdown
                onImport={onImport}
                onExport={onExport}
              />
            )}
            {newLink && (
              <Link href={newLink}>
                <Button variant="secondary" className="bg-pink">
                  เพิ่มข้อมูล
                </Button>
              </Link>
            )}
          </div>
        </div>

        {menu && (
          <div className="flex items-center gap-3 overflow-x-auto grow">
            {menu}
          </div>
        )}
      </header>
      
      {children}
    </>
  );
} 