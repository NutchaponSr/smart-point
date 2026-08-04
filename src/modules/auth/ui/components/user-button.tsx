"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { BsDoorOpen } from "react-icons/bs";

import { authClient } from "@/lib/convex/auth-client";
import { useCRPC } from "@/lib/convex/crpc";
import { pickLocalized } from "@/lib/i18n/localized";
import { getAvatarInitialFromName } from "@/lib/name-initial";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "./user-avatar";
import { Button } from "@/components/ui/button";

const KEEP_FULL_NAME =
  /^(admin|แอดมิน)\s*[1-3]$/i;

function shortDisplayName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  if (KEEP_FULL_NAME.test(trimmed)) return trimmed;
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export const UserButton = () => {
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();
  const crpc = useCRPC();

  const { data: session } = authClient.useSession();
  const { data: currentUser } = useQuery(
    crpc.user.getCurrentUser.queryOptions(),
  );

  const displayName = pickLocalized(
    currentUser?.name ?? session?.user?.name,
    locale,
  );

  const fallback = useMemo(
    () => getAvatarInitialFromName(displayName),
    [displayName],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div role="button" className="flex w-full items-center justify-center h-full hover:bg-white border-black bg-pink p-4 text-2xl lg:hover:text-black no-underline transition-colors duration-200 hover:text-black max-w-20 min-w-20 cursor-pointer max-h-20 min-h-20">
          {fallback}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" alignOffset={4} side="bottom" sideOffset={6}>
        <DropdownMenuItem
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.refresh();
                },
              },
            });
          }}
        >
          <BsDoorOpen className="size-5" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const UserButtonDropdown = () => {
  const router = useRouter();
  const t = useTranslations("auth");
  const locale = useLocale();
  const crpc = useCRPC();

  const { data: session } = authClient.useSession();
  const { data: currentUser } = useQuery(
    crpc.user.getCurrentUser.queryOptions(),
  );

  const displayName = pickLocalized(
    currentUser?.name ?? session?.user?.name,
    locale,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="sidebar" size="lg" className="w-full justify-start">
          <UserAvatar
            src={currentUser?.image ?? session?.user?.image ?? undefined}
            name={displayName}
            className={{
              container: "size-7",
            }}
          />
          <span className="text-lg font-medium text-[#777]">
            {shortDisplayName(displayName)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" alignOffset={4} side="bottom" sideOffset={6}>
        <DropdownMenuItem
          className="h-8"
          onClick={() => {
            router.push("/settings");
          }}
        >
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="h-8"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/");
                },
              },
            });
          }}
        >
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
