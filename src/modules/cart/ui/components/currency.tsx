"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";

import CoinIcon from "../../../../../public/coin.svg";
import RubyIcon from "../../../../../public/ruby.svg";
import CoinGivingIcon from "../../../../../public/coin-give.svg";

import { useSuspenseQuery } from "@tanstack/react-query";
import { cva, type VariantProps } from "class-variance-authority";

import { useCRPC } from "@/lib/convex/crpc";
import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
        title="คะแนนให้เพื่อน"
        description="คะแนนที่ใช้ชื่นชมเพื่อนร่วมงาน รีเซ็ตทุกต้นเดือนและหมดอายุสิ้นเดือน"
      />
      <Currency
        amount={wallet.receivingBudget}
        image={CoinIcon}
        color="blue"
        title="คะแนนที่ได้รับ"
        description="คะแนนที่ได้รับจากเพื่อนร่วมงาน ใช้แลกรางวัลในร้านค้าได้"
      />
      <Currency
        amount={wallet.specialBudget}
        image={RubyIcon}
        color="red"
        title="คะแนนพิเศษ"
        description="คะแนนที่ได้รับจากกิจกรรมพิเศษ ใช้แลกรางวัลพิเศษได้"
      />
    </div>
  );
}

/** ไอคอน coin + ruby ซ้อนกัน + ตัวเลข gradient ฟ้า→ชมพู */
export function CombinedPointsBadge({
  amount,
  size = "md",
  className,
}: {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const iconSize = size === "lg" ? 24 : size === "sm" ? 18 : 22;
  const textClass =
    size === "lg"
      ? "text-2xl sm:text-3xl"
      : size === "sm"
        ? "text-base"
        : "text-xl sm:text-2xl";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative shrink-0",
          size === "lg" ? "h-8 w-11" : size === "sm" ? "h-6 w-8" : "h-7 w-9",
        )}
        aria-hidden
      >
        <Image
          src={CoinIcon}
          alt=""
          width={iconSize}
          height={iconSize}
          className="absolute top-0 left-0 z-10 drop-shadow-sm"
        />
        <Image
          src={RubyIcon}
          alt=""
          width={iconSize}
          height={iconSize}
          className="absolute top-0.5 left-3 z-0"
        />
      </span>
      <span
        className={cn(
          "bg-linear-to-r from-[#1cb0f6] to-[#cc348d] bg-clip-text font-bold tabular-nums text-transparent",
          textClass,
        )}
      >
        {amount.toLocaleString("th-TH")}
      </span>
    </span>
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={currencyColors({
            color,
            className: "h-auto flex-col gap-0.5 px-2 py-1",
          })}
        >
          <span className="inline-flex items-center gap-1.5">
            <Image src={image} alt="" width={20} height={20} />
            <span className="tabular-nums">{amount}</span>
          </span>
          <span className="text-[10px] font-medium leading-none text-muted-foreground">
            {title}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" sideOffset={8} className="w-72 p-0">
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
      </PopoverContent>
    </Popover>
  );
};
