import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

import { Logo } from "@/components/logo";
import Link from "next/link";
import { metadata, navigations } from "@/constants";
import { UserButtonDropdown } from "@/modules/auth/ui/components/user-button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BsDatabaseFill } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import { Domine } from "next/font/google";

const font = Domine({
  subsets: ["latin"],
})

interface Props {
  children: React.ReactNode;
}

export const MobileNavigations = ({ children }: Props) => {
  const pathname = usePathname();

  /** Strip `/th` or `/en` locale segment; keep a leading `/` (replace was stripping it). */
  const pathWithoutLocale =
    pathname.replace(/^\/(th|en)(?=\/|$)/, "") || "/";
  const isActive = (href: string) =>
    pathWithoutLocale === href ||
    (href !== "/" && pathWithoutLocale.startsWith(`${href}/`));

  return (
    <Sheet>
      {children}
      <SheetContent showCloseButton={false} side="left" className="bg-black gap-0">
        <div className="override grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 text-lg leading-6">
          <Link href="/" aria-label="Smart Point" className="shrink-0">
            <span className={cn("inline-block aspect-115/22 shrink-0 text-2xl font-bold select-none text-white", font.className)}>
              Smart Point
            </span>
          </Link>
        </div>
        <div className="grow flex flex-col overflow-x-hidden overflow-y-auto">
          <section className="mb-12 grid">
            {navigations.map((navigation, index) => (
              <Link key={index} href={navigation.href} className={cn("flex items-center truncate border-y-2 border-white/50 border-b-transparent px-6 py-4 no-underline last:border-b-white/50 hover:text-pink dark:border-foreground/50 dark:border-b-transparent dark:last:border-b-foreground/50 min-h-15 text-white", isActive(navigation.href) && "text-pink")}>
                <navigation.icon className="size-5" />
                <span className="ml-4">{navigation.label}</span>
              </Link>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center truncate border-y-2 border-white/50 border-b-transparent px-6 py-4 no-underline last:border-b-white/50 hover:text-pink dark:border-foreground/50 dark:border-b-transparent dark:last:border-b-foreground/50 min-h-15 text-white">
                <BsDatabaseFill className="size-5" />
                <span className="ml-4 grow text-left">ข้อมูล</span>
                <ChevronRightIcon className="size-5" />
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
        <footer className="mt-auto grid">
          <div className="cursor-pointer outline-none all-unset focus-visible:outline-none group flex items-center justify-between overflow-hidden border-t-2 border-white/50 all-unset hover:text-accent dark:border-foreground/50">
            <UserButtonDropdown />
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}