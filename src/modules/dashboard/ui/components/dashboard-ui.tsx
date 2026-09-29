import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DashboardPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-md", className)}>
      {children}
    </section>
  );
}

export function DashboardCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border-2 border-[#e5e5e5] border-b-4 bg-white p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionBadge({
  index,
  title,
}: {
  index: number;
  title: string;
}) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-md bg-[#1cb0f6] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white">
        {t("section", { index })}
      </span>
      <h2 className="text-base font-extrabold text-[#4b4b4b]">{title}</h2>
    </div>
  );
}

export function formatCount(value: number, locale = "th") {
  return value.toLocaleString(locale === "en" ? "en-GB" : "th-TH");
}

export function formatBaht(value: number, locale = "th") {
  const amount = value.toLocaleString(locale === "en" ? "en-GB" : "th-TH");
  return locale === "en" ? `฿${amount}` : `฿${amount}`;
}
