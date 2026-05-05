"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";
import { BsDatabaseFill } from "react-icons/bs";

import { cn } from "@/lib/utils";

import { metadata, navigations } from "@/constants";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import { Logo } from "@/components/logo";

import { UserButtonDropdown } from "@/modules/auth/ui/components/user-button";


export const Sidebar = () => {
  const pathname = usePathname();

  /** Strip `/th` or `/en` locale segment; keep a leading `/` (replace was stripping it). */
  const pathWithoutLocale =
    pathname.replace(/^\/(th|en)(?=\/|$)/, "") || "/";
  const isActive = (href: string) =>
    pathWithoutLocale === href ||
    (href !== "/" && pathWithoutLocale.startsWith(`${href}/`));

  return (
    <nav className="flex flex-col overflow-x-hidden overflow-y-auto bg-black text-white lg:static lg:w-52 dark:text-foreground">
      <div className="override grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-lg leading-6 lg:hidden">
        <Logo />
      </div>
      <header className="hidden lg:grid p-6">
        <Logo className="lg:px-0" />
      </header>
      <div className="grow flex flex-col overflow-x-hidden overflow-y-auto">
        <section className="mb-12 hidden lg:grid">
          {navigations.map((navigation, index) => (
            <Link key={index} href={navigation.href} className={cn("flex items-center truncate border-y-2 border-white/50 border-b-transparent px-6 py-4 no-underline last:border-b-white/50 hover:text-pink dark:border-foreground/50 dark:border-b-transparent dark:last:border-b-foreground/50 min-h-15", isActive(navigation.href) && "text-pink")}>
              <navigation.icon className="size-5" />
              <span className="ml-4">{navigation.label}</span>
            </Link>
          ))}
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center truncate border-y-2 border-white/50 border-b-transparent px-6 py-4 no-underline last:border-b-white/50 hover:text-pink dark:border-foreground/50 dark:border-b-transparent dark:last:border-b-foreground/50 min-h-15">
              <BsDatabaseFill className="size-5" />
              <span className="ml-4">ข้อมูล</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-[calc(var(--radix-dropdown-menu-trigger-width)-8px)]">
              {metadata.map((metadata) => (
                <Link href={metadata.href} key={metadata.href} className="w-full">
                  <DropdownMenuItem>
                    {metadata.label}
                  </DropdownMenuItem>
                </Link>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </section>
      </div>
      <footer className="mt-auto hidden lg:grid">
        <div className="cursor-pointer outline-none all-unset focus-visible:outline-none group flex items-center justify-between overflow-hidden border-t-2 border-white/50 px-6 py-4 all-unset hover:text-accent dark:border-foreground/50">
          <UserButtonDropdown />
        </div>
      </footer>
    </nav>
  );
}