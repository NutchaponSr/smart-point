"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { SidebarContent } from "./sidebar-content";

export const MobileNavigations = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-1 border-b-2 border-[#e5e5e5] bg-background px-2 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="เปิดเมนู"
              className="shrink-0"
            />
          }
        >
          <MenuIcon className="size-5 text-[#777]" />
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-64 max-w-[85vw] gap-0 border-[#e5e5e5] bg-background p-4 text-[#afafaf] shadow-none"
        >
          <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
          <SidebarContent expandMetadata onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Logo className="mt-0 px-2" />
    </header>
  );
};
