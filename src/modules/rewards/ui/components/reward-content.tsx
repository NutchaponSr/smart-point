"use client";

import { ApiOutputs } from "@convex/api";

import { Button } from "@/components/ui/button";

import { Reward } from "@/modules/rewards/ui/components/reward";

import { RewardSort } from "@/modules/rewards/ui/components/reward-sort";

import { useRewardFilters } from "@/modules/rewards/stores/use-reward-filters";

import { generateSort } from "@/modules/rewards/utils";

import emptyIllustration from "../../../../../public/extra_character_e.svg";

interface Props {
  rewards: ApiOutputs["reward"]["getMany"]["page"];
  hasNextPage: boolean;
  onLoad: () => void;
}

export const RewardContent = ({ rewards, hasNextPage, onLoad }: Props) => {
  const [filters] = useRewardFilters();
  const isEmpty = rewards.length === 0;

  const illustrationSrc =
    typeof emptyIllustration === "string"
      ? emptyIllustration
      : emptyIllustration.src;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-between gap-[.5rem] items-center flex-wrap">
        <h2 className="text-[20px] font-bold leading-[1.3]">
          {generateSort(filters.sort || "curated")}
        </h2>
        <RewardSort />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 border-2 border-dashed border-border rounded-md">
          <img src={illustrationSrc} alt="No rewards" className="size-20" />

          <div className="text-center">
            <p className="text-lg font-bold">ยังไม่มีรางวัล</p>
            <p className="text-sm text-muted-foreground mt-1">
              ลองปรับตัวกรอง หรือกดดูเพิ่มเติมเพื่อโหลดรายการถัดไป
            </p>
          </div>
        </div>
      ) : (
        <>
          <ul>
            {rewards.map((reward) => (
              <li
                key={reward._id}
                className="min-w-[120px] py-5 ps-[120px] relative border-t-2"
              >
                <Reward reward={reward} />
              </li>
            ))}
          </ul>

          {hasNextPage && (
            <div className="mt-8 w-full text-center">
              <Button size="lg" variant="secondaryOutline" onClick={onLoad}>
                ดูเพิ่มเติม
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
};