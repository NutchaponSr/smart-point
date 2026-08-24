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

const sendPointGuideCategories = [
  "helpfulness",
  "teamwork",
  "care",
] as const;

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
            <div className="grid divide-y-2 divide-[#e5e5e5]">
              {sendPointGuideCategories.map((category, index) => {
                const items = t.raw(
                  `points-help.categories.${category}.items`,
                ) as string[];

                return (
                  <section
                    key={category}
                    className="py-2.5 first:pt-0 last:pb-0"
                  >
                    <h3 className="mb-1.5 text-sm font-bold text-[#4b4b4b]">
                      {index + 1}.{" "}
                      {t(`points-help.categories.${category}.title`)}
                    </h3>
                    <ul className="grid list-disc gap-1 ps-4 text-xs leading-relaxed text-[#4b4b4b]/90">
                      {items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
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
