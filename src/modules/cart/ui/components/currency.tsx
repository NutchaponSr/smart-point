"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";

import CoinIcon from "../../../../../public/coin.svg";
import RubyIcon from "../../../../../public/ruby.svg";
import CoinGivingIcon from "../../../../../public/coin-give.svg";

import { useSuspenseQuery } from "@tanstack/react-query";
import { cva, type VariantProps } from "class-variance-authority";

import { useCRPC } from "@/lib/convex/crpc";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

const currencyColors = cva("", {
  variants: {
    color: {
      yellow: "text-[#f1c40f]",
      blue: "text-[#1cb0f6]",
      red: "text-[#cc348d]",
    },
  },
  defaultVariants: {
    color: "blue",
  },
});

export const Currencies = () => {
  const crpc = useCRPC();

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  return (
    <div className="relative flex h-full flex-row justify-between w-full items-center">
      <Currency
        amount={wallet.givingBudget}
        image={CoinGivingIcon}
        color="yellow"
        title="คะแนนมอบให้"
        description="คะแนนที่ใช้ชื่นชมเพื่อนร่วมงาน รีเซ็ตทุกต้นเดือนและหมดอายุสิ้นเดือน"
      />
      <Currency
        amount={wallet.receivingBudget}
        image={CoinIcon}
        color="blue"
        title="พอยต์ที่ได้รับ"
        description="คะแนนที่ได้รับจากเพื่อนร่วมงาน ใช้แลกรางวัลในร้านค้าได้"
      />
      <Currency
        amount={wallet.specialBudget}
        image={RubyIcon}
        color="red"
        title="พอยต์พิเศษ"
        description="คะแนนที่ได้รับจากกิจกรรมพิเศษ ใช้แลกรางวัลพิเศษได้"
      />
    </div>
  );
}

export const Currency = ({
  amount,
  image,
  title,
  description,
  color,
}: {
  amount: number;
  image: StaticImageData;
  title: string;
  description: string;
  color: VariantProps<typeof currencyColors>["color"];
}) => {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={200}
        closeDelay={100}
        render={
          <Button variant="ghost" className={currencyColors({ color })} />
        }
      >
        <Image src={image} alt="" width={24} height={24} />
        {amount}
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-72 p-0">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Image src={image} alt="" width={32} height={32} />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium leading-none">{title}</p>
              <p
                className={currencyColors({
                  color,
                  className: "text-2xl font-bold tabular-nums",
                })}
              >
                {amount}
              </p>
            </div>
          </div>
          <p className="text-sm leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
