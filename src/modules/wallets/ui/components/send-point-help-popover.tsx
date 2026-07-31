"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import CoinGivingIcon from "../../../../../public/coin-give.svg";

const sendPointGuideTiers = [5, 10, 20] as const;

type SendPointHelpPopoverProps = {
  className?: string;
  variant?: "default" | "light";
};

export function SendPointHelpPopover({
  className,
  variant = "default",
}: SendPointHelpPopoverProps) {
  const t = useTranslations("wallet");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("points-help.aria-label")}
          className={cn(
            "inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
            variant === "light"
              ? "border-white/70 text-white hover:bg-white/15"
              : "border-[#afafaf] text-[#afafaf] hover:border-[#1cb0f6] hover:text-[#1cb0f6]",
            className,
          )}
        >
          ?
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="max-h-[min(70vh,28rem)] w-[min(calc(100vw-2rem),20rem)] overflow-y-auto p-0"
      >
        <div className="sticky top-0 z-1 border-b-2 border-[#e5e5e5] bg-[#ddf4ff] px-3 py-2.5">
          <p className="text-sm font-bold text-[#1cb0f6]">
            {t("points-help.title")}
          </p>
          <p className="mt-0.5 text-xs text-[#4b4b4b]/90">
            {t("points-help.subtitle")}
          </p>
        </div>

        <div className="grid divide-y-2 divide-[#e5e5e5]">
          {sendPointGuideTiers.map((tier) => (
            <section key={tier} className="px-3 py-2.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Image
                  src={CoinGivingIcon}
                  alt=""
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                <h3 className="text-sm font-bold text-[#f1c40f]">{tier}</h3>
              </div>
              <p className="text-xs leading-relaxed text-[#4b4b4b]/90">
                {t(`points.${tier}-points`)}
              </p>
            </section>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
