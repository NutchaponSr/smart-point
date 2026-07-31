"use client";

import { ApiOutputs } from "@convex/api";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { Reward } from "@/modules/rewards/ui/components/reward";

import { RewardSort } from "@/modules/rewards/ui/components/reward-sort";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

import emptyIllustration from "../../../../../public/extra_character_e.svg";

interface Props {
  rewards: ApiOutputs["reward"]["getMany"]["page"];
  hasNextPage: boolean;
  onLoad: () => void;
}

export const RewardContent = ({ rewards, hasNextPage, onLoad }: Props) => {
  const t = useTranslations("reward");

  const [filters] = useRewardFilters();
  const isEmpty = rewards.length === 0;
  const sort = filters.sort || "curated";

  const illustrationSrc =
    typeof emptyIllustration === "string"
      ? emptyIllustration
      : emptyIllustration.src;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between gap-2 items-center flex-wrap">
        <h2 className="text-[20px] font-bold leading-[1.3]">
          {t(`sort.${sort}-title`)}
        </h2>
        <RewardSort />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 border-2 border-dashed border-border rounded-md">
          <img src={illustrationSrc} alt={t("empty-alt")} className="size-20" />

          <div className="text-center">
            <p className="text-lg font-bold">{t("no-rewards.title")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("no-rewards.description")}
            </p>
          </div>
        </div>
      ) : (
        <>
          <ul>
            {rewards.map((reward) => (
              <li
                key={reward._id}
                className="py-5 relative border-t-2"
              >
                <Reward reward={reward} />
              </li>
            ))}
          </ul>

          {hasNextPage && (
            <div className="mt-8 w-full text-center">
              <Button size="lg" variant="secondaryOutline" onClick={onLoad}>
                {t("load-more")}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};
