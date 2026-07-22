"use client";

import Image from "next/image";

import QuestIcon from "../../../../../public/quest.svg";
import SpecialCoin from "../../../../../public/ruby.svg";
import BrickCorner from "../../../../../public/brick_high_slope_inverted_left_yellow_2.svg";

import { useMemo } from "react";
import { startOfMonth } from "date-fns";
import { useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useCRPC } from "@/lib/convex/crpc";


interface QuestProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

function QuestProgressBar({ value, max, className }: QuestProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full rounded-r-none bg-[#e5e5e5] me-0.5",
        className,
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`ความคืบหน้า ${value} จาก ${max}`}
    >
      <div
        className="relative h-full rounded-full bg-[#58cc02] transition-[width] duration-500 ease-out"
        style={{ width: percent > 0 ? `${percent}%` : "0%" }}
      >
        <div className="absolute inset-x-1.5 top-1 h-[3px] rounded-full bg-[#89e219]" />
      </div>
      <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-[11px] font-bold text-[#e5e5e5]">
        {value} / {max}
      </span>
    </div>
  );
}

export const MonthlyQuest = () => {
  const crpc = useCRPC();
  const monthStart = useMemo(() => startOfMonth(new Date()).getTime(), []);

  const { data } = useSuspenseQuery(
    crpc.transaction.getMonthlyQuestProgress.queryOptions({ monthStart }),
  );

  return (
    <article className="relative overflow-hidden rounded-md border-2 border-[#e5e5e5] bg-white">
      <header className="relative border-b-2 border-[#e5e5e5] bg-[#ddf4ff] px-4 py-3">
        <Image
          src={BrickCorner}
          alt=""
          aria-hidden
          className="pointer-events-none absolute -right-px -bottom-px size-10"
        />
        <div className="relative z-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-snug text-[#1cb0f6]">
              ภารกิจประจำเดือน
            </h2>
          </div>
        </div>
      </header>

      <div className="flex items-center w-full py-5 px-4">
        <Image 
          src={SpecialCoin}
          alt="Special Coin"
          width={56}
          height={56}
          className="me-[18px] self-start"
        />
        <div className="flex flex-col gap-0.5 text-left w-full">
          <span className="text-sm leading-6 font-bold">
            มอบคะแนนให้เพื่อน 1 ครั้ง รับ 1 Point (สูงสุด 20 Point/เดือน)
          </span>
          <div className="flex items-center mr-1">
            <QuestProgressBar value={data.count} max={data.goal} />
            <Image src={QuestIcon} alt="Quest Icon" width={36} height={36} />
          </div>
        </div>
      </div>
    </article>
  );
};
