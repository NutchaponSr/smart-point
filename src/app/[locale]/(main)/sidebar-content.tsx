"use client";

import Link from "next/link";
import Image from "next/image";

import FolderIcon from "../../../../public/folder.svg";
import ComputerIcon from "../../../../public/computer.svg";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { metadata, navigations } from "@/constants";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { Logo } from "@/components/logo";

import { UserButtonDropdown } from "@/modules/auth/ui/components/user-button";

import { canShowByRole, usePermission } from "@/modules/auth/hooks/use-permisson";

interface SidebarContentProps {
  onNavigate?: () => void;
  showLogo?: boolean;
  /** Expand metadata links inline (better inside mobile sheet). */
  expandMetadata?: boolean;
  className?: string;
}

export const SidebarContent = ({
  onNavigate,
  showLogo = true,
  expandMetadata = false,
  className,
}: SidebarContentProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const t = useTranslations("nav");

  const { isAdmin } = usePermission();

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

  const isMetadataActive = visibleMetadata.some((item) => isActive(item.href));

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {showLogo && (
        <div className="shrink-0 py-6 pl-2 md:py-8 md:pl-4">
          <Logo className="mt-2 px-2 md:mt-6 md:px-6" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {visibleNavigations.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            <Button
              size="lg"
              variant={isActive(item.href) ? "sidebarOutline" : "sidebar"}
              className="w-full justify-start tracking-wide text-base"
            >
              <Image
                src={item.icon}
                alt={t(item.label)}
                width={28}
                height={28}
              />
              {t(item.label)}
            </Button>
          </Link>
        ))}
        {visibleMetadata.length > 0 &&
          (expandMetadata ? (
            <div className="flex flex-col gap-1">
              <div
                className={cn(
                  "flex h-13 items-center gap-3 px-4 text-base tracking-wide text-[#777]",
                  isMetadataActive && "text-sky-500",
                )}
              >
                <Image
                  src={ComputerIcon}
                  alt={t("data")}
                  width={28}
                  height={28}
                />
                {t("data")}
              </div>
              {visibleMetadata.map((item) => (
                <Link key={item.href} href={item.href} onClick={onNavigate}>
                  <Button
                    size="lg"
                    variant={isActive(item.href) ? "sidebarOutline" : "sidebar"}
                    className="w-full justify-start tracking-wide pl-12 text-base"
                  >
                    <Image
                      src={FolderIcon}
                      alt={t(item.label)}
                      width={28}
                      height={28}
                    />
                    {t(item.label)}
                  </Button>
                </Link>
              ))}
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  variant={isMetadataActive ? "sidebarOutline" : "sidebar"}
                  className="w-full justify-start tracking-wide text-base"
                >
                  <Image
                    src={ComputerIcon}
                    alt={t("data")}
                    width={28}
                    height={28}
                  />
                  {t("data")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {visibleMetadata.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      onNavigate?.();
                    }}
                  >
                    <Image
                      src={FolderIcon}
                      alt={t(item.label)}
                      width={28}
                      height={28}
                    />
                    {t(item.label)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
      </div>
      <footer className="shrink-0 py-4">
        <UserButtonDropdown />
      </footer>
    </div>
  );
};
