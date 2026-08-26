"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type AppVersionProps = {
  version: string;
  className?: string;
};

export function AppVersion({ version, className }: AppVersionProps) {
  const t = useTranslations("app");

  return (
    <p
      className={cn(
        "text-xs font-bold tracking-wide text-[#afafaf]",
        className,
      )}
    >
      {t("version", { version })}
    </p>
  );
}
