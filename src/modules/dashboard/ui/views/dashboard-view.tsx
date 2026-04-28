"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Navigations } from "@/components/navigations";

import { links } from "@/modules/dashboard/constants";

export const DashboardView = () => {
  return (
    <div>
      <header className="flex flex-col gap-4 border-border p-4 md:py-6 md:px-8 border-b-0 sm:border-b-2 h-[142.5px]">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <h1 className="line-clamp-2 text-2xl hidden! sm:block!">
            แดชบอร์ด
          </h1>
        </div>
        <div className="flex gap-3 overflow-x-auto">
          <Link href="/dashboard">
            <Button variant="rounded" size="smRounded">
              ภาพรวม
            </Button>
          </Link>
          <Navigations links={links} />
        </div>
      </header>
    </div>
  );
};