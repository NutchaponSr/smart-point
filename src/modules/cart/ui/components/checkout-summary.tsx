"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { CombinedPointsBadge } from "@/modules/cart/ui/components/currency";

interface Props {
  totalPoints: number;
  itemCount: number;
  fromReceiving?: number;
  fromSpecial?: number;
  className?: string;
}

export const CheckoutSummary = ({
  totalPoints,
  itemCount,
  fromReceiving,
  fromSpecial,
  className,
}: Props) => {
  const t = useTranslations("cart.summary");
  const locale = useLocale();

  const showSplit =
    fromReceiving != null &&
    fromSpecial != null &&
    (fromReceiving > 0 || fromSpecial > 0);

  return (
    <div
      className={cn(
        "grid gap-4 rounded-md border-2 bg-background p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t("item-count-label")}</span>
        <span className="font-medium text-foreground">
          {t("item-count", { count: itemCount })}
        </span>
      </div>

      <div className="h-0.5 bg-border" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold sm:text-lg">{t("total")}</span>
        <CombinedPointsBadge amount={totalPoints} />
      </div>

      {showSplit ? (
        <p className="text-xs text-muted-foreground">
          {t.rich("deduct", {
            receiving: () => (
              <span className="font-semibold tabular-nums text-[#1cb0f6]">
                {fromReceiving.toLocaleString(locale)}
              </span>
            ),
          })}
          {fromSpecial > 0
            ? t.rich("deduct-special", {
                special: () => (
                  <span className="font-semibold tabular-nums text-[#cc348d]">
                    {fromSpecial.toLocaleString(locale)}
                  </span>
                ),
              })
            : null}
        </p>
      ) : null}
    </div>
  );
};
