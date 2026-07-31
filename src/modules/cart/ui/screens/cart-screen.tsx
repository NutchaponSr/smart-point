"use client";

import Link from "next/link";

import checkoutImage from "../../../../../public/checkout.png";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { RiShoppingBag3Line } from "react-icons/ri";

import { useCRPC } from "@/lib/convex/crpc";

import { Button } from "@/components/ui/button";

import { CheckoutItem } from "@/modules/cart/ui/components/checkout-item";
import { CheckoutSummary } from "@/modules/cart/ui/components/checkout-summary";
import { CombinedPointsBadge, Currencies } from "@/modules/cart/ui/components/currency";

function splitCheckoutCost(
  receivingBudget: number,
  specialBudget: number,
  totalPoints: number,
) {
  const receiving = Math.max(0, receivingBudget);
  const special = Math.max(0, specialBudget);
  const available = receiving + special;
  const fromReceiving = Math.min(receiving, totalPoints);
  const fromSpecial = Math.max(0, totalPoints - fromReceiving);

  return {
    available,
    fromReceiving,
    fromSpecial,
    remainingReceiving: receiving - fromReceiving,
    remainingSpecial: special - fromSpecial,
    shortfall: Math.max(0, totalPoints - available),
    canAfford: available >= totalPoints,
  };
}

export const CartScreen = () => {
  const t = useTranslations("cart");
  const locale = useLocale();
  const crpc = useCRPC();
  const router = useRouter();

  const { data: cart } = useSuspenseQuery(crpc.cart.getCart.queryOptions());
  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());

  const checkout = useMutation(crpc.cart.redeemCart.mutationOptions());
  const remove = useMutation(crpc.cart.removeCartItem.mutationOptions());

  const itemCount = cart.items.length;
  const receiving = wallet.receivingBudget;
  const special = wallet.specialBudget ?? 0;
  const payment = splitCheckoutCost(receiving, special, cart.totalPoints);

  if (!itemCount) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center sm:px-10 sm:py-14">
        <figure className="w-full max-w-sm overflow-hidden rounded-lg">
          <img
            src={checkoutImage.src}
            alt=""
            className="w-full object-cover"
          />
        </figure>

        <div className="grid max-w-md gap-2">
          <h2 className="text-xl font-semibold">{t("empty.title")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("empty.description")}
          </p>
        </div>

        <Link href="/rewards">
          <Button size="lg" variant="secondary">
            <RiShoppingBag3Line className="size-5" />
            {t("empty.browse")}
          </Button>
        </Link>
      </div>
    );
  }

  const confirmButton = (
    <Button
      size="lg"
      className="w-full"
      disabled={checkout.isPending || !payment.canAfford}
      onClick={() =>
        checkout.mutate(
          {},
          {
            onSuccess: () => {
              router.push("/purchases");
              toast.success(t("success"));
            },
            onError: (err) => {
              const msg =
                err instanceof Error ? err.message : t("error");
              toast.error(msg);
            },
          },
        )
      }
    >
      {checkout.isPending ? t("confirming") : t("confirm")}
    </Button>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:gap-8 lg:pb-0">
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {t("items-title")}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({itemCount})
            </span>
          </h2>
        </div>

        <div className="overflow-hidden rounded-md border-2 bg-background">
          {cart.items.map((item) => (
            <CheckoutItem
              key={item._id}
              item={item}
              onRemove={() =>
                remove.mutate(
                  { cartItemId: item._id },
                  {
                    onError: (err) => {
                      const msg =
                        err instanceof Error ? err.message : t("remove-error");
                      toast.error(msg);
                    },
                  },
                )
              }
              isRemoving={
                remove.isPending && remove.variables?.cartItemId === item._id
              }
            />
          ))}
        </div>
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <Currencies />
        <div className="flex items-center justify-between gap-3 rounded-md border-2 bg-background px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            {t("available-points")}
          </span>
          <CombinedPointsBadge amount={payment.available} size="sm" />
        </div>

        <CheckoutSummary
          totalPoints={cart.totalPoints}
          itemCount={itemCount}
          fromReceiving={payment.fromReceiving}
          fromSpecial={payment.fromSpecial}
        />

        {!payment.canAfford ? (
          <p className="rounded-md border-2 border-[#ff0000] px-4 py-3 text-sm font-semibold text-[#ff0000]">
            {t("insufficient", {
              amount: payment.shortfall.toLocaleString(locale),
            })}
          </p>
        ) : (
          <p className="px-1 text-sm text-muted-foreground">
            {t.rich("remaining-after", {
              receiving: () => (
                <span className="font-semibold tabular-nums text-[#1cb0f6]">
                  {payment.remainingReceiving.toLocaleString(locale)}
                </span>
              ),
              special: () => (
                <span className="font-semibold tabular-nums text-[#cc348d]">
                  {payment.remainingSpecial.toLocaleString(locale)}
                </span>
              ),
            })}
          </p>
        )}

        <div className="hidden lg:block">{confirmButton}</div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-[#e5e5e5] bg-background p-4 lg:hidden">
        {confirmButton}
      </div>
    </div>
  );
};
