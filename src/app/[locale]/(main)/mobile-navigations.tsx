"use client";

import Link from "next/link";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { BsDatabaseFill } from "react-icons/bs";

import { cn } from "@/lib/utils";

import { metadata, navigations } from "@/constants";
import { canShowByRole, usePermission } from "@/modules/auth/hooks/use-permisson";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Logo } from "@/components/logo";

import { UserButtonDropdown } from "@/modules/auth/ui/components/user-button";

interface Props {
  children: React.ReactNode;
}

export const MobileNavigations = ({ children }: Props) => {
  const pathname = usePathname();
  const { isAdmin } = usePermission();
  const [open, setOpen] = useState(false);

  const visibleNavigations = navigations.filter((item) =>
    canShowByRole(item, isAdmin),
  );
  const visibleMetadata = metadata.filter((item) =>
    canShowByRole(item, isAdmin),
  );

  const pathWithoutLocale =
    pathname.replace(/^\/(th|en)(?=\/|$)/, "") || "/";
  const isActive = (href: string) =>
    pathWithoutLocale === href ||
    (href !== "/" && pathWithoutLocale.startsWith(`${href}/`));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children}
      <SheetContent
        side="left"
        showCloseButton
        className="w-80 max-w-[85vw] gap-0 border-none bg-black p-0 text-white dark:text-foreground"
      >
        <SheetHeader className="border-b-2 border-white/50 p-4 dark:border-foreground/50">
          <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
          <Logo />
        </SheetHeader>

        <nav className="flex flex-1 flex-col overflow-y-auto">
          {visibleNavigations.map((navigation, index) => (
            <Link
              key={index}
              href={navigation.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex min-h-15 items-center truncate border-y-2 border-white/50 border-b-transparent px-6 py-4 no-underline last:border-b-white/50 hover:text-pink dark:border-foreground/50 dark:border-b-transparent dark:last:border-b-foreground/50",
                isActive(navigation.href) && "text-pink",
              )}
            >
              <navigation.icon className="size-5" />
              <span className="ml-4">{navigation.label}</span>
            </Link>
          ))}

          {visibleMetadata.length > 0 && (
            <div className="border-y-2 border-white/50 dark:border-foreground/50">
              <div className="flex min-h-15 items-center truncate px-6 py-4">
                <BsDatabaseFill className="size-5" />
                <span className="ml-4">ข้อมูล</span>
              </div>
              {visibleMetadata.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center truncate border-t border-white/20 px-6 py-3 pl-14 no-underline hover:text-pink dark:border-foreground/20",
                    isActive(item.href) && "text-pink",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <footer className="mt-auto border-t-2 border-white/50 dark:border-foreground/50">
          <UserButtonDropdown />
        </footer>
      </SheetContent>
    </Sheet>
  );
};
