"use client";

import { ApiOutputs } from "@convex/api";
import { useEffect, useRef, useState } from "react";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi2";

import { Reward } from "@/modules/rewards/ui/components/reward";

interface Props {
  rewards: ApiOutputs["reward"]["getMany"]["page"];
}

export const RecommendContent = ({ rewards }: Props) => {
  const itemCount = rewards.length;
  const maxIndex = Math.max(0, itemCount - 1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    setCurrentIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const goToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(nextIndex, maxIndex));
    itemRefs.current[clamped]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
    setCurrentIndex(clamped);
  };

  if (!rewards.length) return null;

  return (
    <section className="grid w-full min-w-0 gap-4 overflow-x-hidden">
      <header className="flex min-w-0 items-center justify-between gap-3">
        <h2 className="font-normal text-[20px] leading-[1.3]">แนะนำ</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToIndex(currentIndex - 1)}
            disabled={itemCount === 0 || currentIndex === 0}
            className="disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="previous item"
          >
            <HiArrowLeft className="size-4 stroke-[0.5]" />
          </button>
          <span className="text-sm font-medium">
            {itemCount === 0 ? 0 : currentIndex + 1} / {itemCount}
          </span>
          <button
            type="button"
            onClick={() => goToIndex(currentIndex + 1)}
            disabled={itemCount === 0 || currentIndex >= maxIndex}
            className="disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="next item"
          >
            <HiArrowRight className="size-4 stroke-[0.5]" />
          </button>
        </div>
      </header>

      <div className="relative min-w-0 max-w-full">
        <div className="grid min-h-80 w-full max-w-full min-w-0 auto-cols-[min(20rem,60vw)] grid-flow-col gap-6 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:none] lg:auto-cols-[32rem] [&::-webkit-scrollbar]:hidden">
          {rewards.map((reward, index) => (
            <Reward
              key={reward._id}
              reward={reward}
              variant="grid"
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};