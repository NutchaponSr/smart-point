"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SendPointHelpDialogProps = {
  className?: string;
};

export function SendPointHelpDialog({ className }: SendPointHelpDialogProps) {
  const t = useTranslations("wallet");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t("points-help.aria-label")}
        className={cn(
          "inline-flex shrink-0 items-center justify-center text-xs font-medium text-[#afafaf] underline underline-offset-2 transition-colors hover:text-[#1cb0f6]",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        {t("points-help.title")}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[min(90vh,40rem)] sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1cb0f6]">
              {t("points-help.title")}
            </DialogTitle>
            <p className="text-xs text-[#4b4b4b]/90">
              {t("points-help.subtitle")}
            </p>
          </DialogHeader>

          <div className="max-h-[min(50vh,24rem)] overflow-y-auto">
            <ol className="grid list-decimal gap-2 ps-5 text-xs leading-relaxed text-[#4b4b4b]/90">
              {(t.raw("points-help.items") as string[]).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          <DialogFooter className="border-[#e5e5e5] bg-[#f7f7f7]">
            <Button
              type="button"
              variant="secondary"
              className="w-full font-bold sm:w-auto"
              onClick={() => setOpen(false)}
            >
              {t("points-help.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
