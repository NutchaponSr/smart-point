"use client";

import { useState } from "react";
import CurrencyInput from "react-currency-input-field";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HiHeart } from "react-icons/hi2";

import { useCRPC } from "@/lib/convex/crpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function intFromCurrencyValue(raw: string | undefined) {
  if (raw === undefined || raw === "") return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : Math.trunc(n);
}

const currencyIntClassName =
  "font-[inherit] min-h-11 px-4 text-sm leading-snug border-2 border-border rounded-md block w-full bg-background placeholder:text-muted-foreground focus:outline-1 focus:outline-[#1cb0f6] focus:border-[#1cb0f6] focus:border-2 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

export const DonateButton = () => {
  const t = useTranslations("reward.donate");
  const crpc = useCRPC();
  const queryClient = useQueryClient();

  const { data: wallet } = useSuspenseQuery(crpc.wallet.getOne.queryOptions());
  const { data: totals } = useSuspenseQuery(
    crpc.donation.getTotals.queryOptions(),
  );

  const available =
    (wallet.receivingBudget ?? 0) + (wallet.specialBudget ?? 0);

  const [pointsInput, setPointsInput] = useState<string>("1");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const points = intFromCurrencyValue(pointsInput);
  const isValid =
    points !== undefined && points >= 1 && points <= available;

  const donate = useMutation(crpc.donation.donate.mutationOptions());

  const onConfirm = () => {
    if (!isValid || points === undefined) return;

    donate.mutate(
      { points },
      {
        onSuccess: (result) => {
          toast.success(t("success", { amount: result.points }));
          setConfirmOpen(false);
          setPointsInput("1");
          void queryClient.invalidateQueries({
            queryKey: crpc.wallet.getOne.queryKey(),
          });
          void queryClient.invalidateQueries({
            queryKey: crpc.donation.getTotals.queryKey(),
          });
          void queryClient.invalidateQueries({
            queryKey: crpc.activityLog.getLatest.queryKey(),
          });
        },
        onError: (error) => {
          const msg =
            error instanceof Error ? error.message : t("error");
          toast.error(msg);
        },
      },
    );
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border-2 border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#3c3c3c]">{t("title")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("rate")}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fce7f3] text-[#cc348d]">
          <HiHeart className="size-5" />
        </span>
      </div>

      <div className="rounded-md border-2 border-dashed border-border bg-[#f7f7f7] px-3 py-2.5">
        <p className="text-[11px] font-medium text-muted-foreground">
          {t("total-label")}
        </p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-[#cc348d]">
          {totals.totalBaht.toLocaleString("th-TH")}{" "}
          <span className="text-sm font-bold text-muted-foreground">
            {t("baht-unit")}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {t("total-points", {
            amount: totals.totalPoints.toLocaleString("th-TH"),
          })}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="donate-points"
          className="text-xs font-bold text-[#3c3c3c]"
        >
          {t("amount-label")}
        </label>
        <CurrencyInput
          id="donate-points"
          name="donate-points"
          value={pointsInput}
          onValueChange={(value) => setPointsInput(value ?? "")}
          min={1}
          allowNegativeValue={false}
          decimalsLimit={0}
          decimalScale={0}
          intlConfig={{ locale: "th-TH" }}
          placeholder="0"
          className={cn(currencyIntClassName)}
          disabled={available < 1 || donate.isPending}
        />
        <p className="text-[11px] text-muted-foreground">
          {t("available", { amount: available.toLocaleString("th-TH") })}
        </p>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={available < 1 || donate.isPending}
        onClick={() => {
          if (!isValid) {
            toast.error(
              available < 1 ? t("insufficient") : t("invalid-amount"),
            );
            return;
          }
          setConfirmOpen(true);
        }}
      >
        <HiHeart className="size-5" />
        {t("cta")}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("confirm-title")}</DialogTitle>
            <DialogDescription>
              {t("confirm", {
                amount: points ?? 0,
                baht: points ?? 0,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="secondaryOutline"
              onClick={() => setConfirmOpen(false)}
              disabled={donate.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onConfirm}
              disabled={donate.isPending || !isValid}
            >
              {donate.isPending ? t("confirming") : t("confirm-cta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
