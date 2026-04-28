"use client";

import Link from "next/link";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { GoSearch } from "react-icons/go";
import { SearchInput } from "./search-input";
import { ExcelDropdown } from "./excel-dropdown";
import { Navigations } from "./navigations";
import { links } from "@/modules/dashboard/constants";

interface Props {
  title: string;
  children: React.ReactNode;
  onImport?: (file: File) => Promise<void>;
  onExport?: () => Promise<void>;
  filter?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  newLink?: string;
}

export const Main = ({
  title,
  children,
  onImport,
  onExport,
  filter,
  searchValue,
  onSearchChange,
  newLink ,
}: Props) => {
  return (
    <>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[142.5px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">พนักงาน</h1>

          <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
            {searchValue && onSearchChange && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="elevated" size="iconLg">
                    <GoSearch className="size-5 stroke-[0.25]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-4">
                  <SearchInput
                    value={searchValue}
                    onChange={onSearchChange}
                  />
                </PopoverContent>
              </Popover>
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
                <Button variant="elevated" className="bg-pink">
                  เพิ่มข้อมูล
                </Button>
              </Link>
            )}
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
      
      {children}
    </>
  );
} 