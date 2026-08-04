"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import LeaderboardIcon from "../../../../../public/leaderboard.svg";

import { LeaderboardScreen } from "@/modules/transactions/ui/screens/leaderboard-screen";
import { LeaderboardFilters } from "@/modules/transactions/ui/components/leaderboard-filters";

export const LeaderboardView = () => {
  const t = useTranslations("leaderboard");

  return (
    <div className="flex flex-col gap-6 px-6">
      <div className="flex flex-col gap-6 lg:flex-row-reverse lg:gap-12">
        <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-6 lg:z-1 lg:w-[368px] lg:shrink-0 lg:self-start">
          <LeaderboardFilters />
        </aside>

        <div className="z-0 min-w-0 flex-1">
          <div className="grid gap-6 py-0 lg:py-6">
            <header className="flex flex-col items-center gap-2 text-center">
              <Image
                src={LeaderboardIcon}
                alt={t("alt")}
                width={100}
                height={100}
                className="size-16 sm:size-[100px]"
              />
              <h1 className="text-xl font-bold sm:text-2xl">{t("title")}</h1>
              <p className="text-sm text-muted-foreground sm:text-base"></p>
            </header>

            <LeaderboardScreen />
          </div>
        </div>
      </div>
    </div>
  );
};
