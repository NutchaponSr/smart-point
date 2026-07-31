"use client";

import placeholder from "../../../../../public/placeholder.png";

import { ApiOutputs } from "@convex/api";
import { useLocale, useTranslations } from "next-intl";
import { RiDeleteBin6Line } from "react-icons/ri";

import { pickLocalized } from "@/lib/i18n/localized";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { CombinedPointsBadge } from "@/modules/cart/ui/components/currency";

interface Props {
  item: ApiOutputs["cart"]["getCart"]["items"][number];
  onRemove: () => void;
  isRemoving?: boolean;
  className?: string;
}

export const CheckoutItem = ({
  item,
  onRemove,
  isRemoving,
  className,
}: Props) => {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { reward, quantity } = item;
  const lineTotal = reward.pointCost * quantity;
  const name = pickLocalized(reward.name, locale);
  const description = pickLocalized(reward.description, locale);

  return (
    <article
      className={cn(
        "group flex items-start gap-4 border-border p-4 sm:gap-5 sm:p-5 not-first:border-t-2",
        className,
      )}
    >
      <div className="relative shrink-0 self-start" >
        <figure className="size-20 overflow-hidden rounded-md border-2 sm:size-24">
          <img
            src={reward.image || placeholder.src}
            alt={name}
            loading="lazy"
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        </figure>
        <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-background bg-[#1cb0f6] text-xs font-semibold text-white">
          {quantity}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="line-clamp-2 text-base font-semibold leading-snug no-underline hover:text-[#1cb0f6] sm:text-lg">
              {name}
            </div>
            {description ? (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>

          <CombinedPointsBadge amount={lineTotal} size="sm" className="shrink-0" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isRemoving}
            className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-destructive"
          >
            <RiDeleteBin6Line className="size-4" />
            {t("remove")}
          </Button>
        </div>
      </div>
    </article>
  );
};
