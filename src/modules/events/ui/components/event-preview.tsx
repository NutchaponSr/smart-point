"use client";

import Ruby from "../../../../../public/ruby.svg";

import { GoPersonFill } from "react-icons/go";
import { useLocale } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { pickLocalized } from "@/lib/i18n/localized";
import type { EventSchema } from "@/modules/events/schema";
import { categories, buRestrictedCategories } from "../../constants";
import { formatAllowedBuLabels } from "@/modules/events/utils/bu-labels";

export const EventPreview = () => {
  const locale = useLocale();
  const { control } = useFormContext<EventSchema>();

  const name = useWatch({ control, name: "name" });
  const point = useWatch({ control, name: "point" });
  const description = useWatch({ control, name: "description" });
  const maxParticipants = useWatch({ control, name: "maxParticipants" });
  const category = useWatch({ control, name: "category" });
  const allowedDivisions = useWatch({ control, name: "allowedDivisions" });
  const allowedDepartments = useWatch({ control, name: "allowedDepartments" });

  const title = pickLocalized(name, locale);
  const cost =
    point === undefined || point === null || Number.isNaN(Number(point))
      ? "—"
      : String(point);
  const des = pickLocalized(description, locale);
  const categoryName = categories[category]?.th;
  const buLabels = buRestrictedCategories.includes(
    category as (typeof buRestrictedCategories)[number],
  )
    ? formatAllowedBuLabels(allowedDivisions, allowedDepartments)
    : [];

  return (
    <article className="relative grid min-w-0 overflow-hidden rounded-md border-2 bg-background lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <section className="min-w-0 lg:border-r-2">
        <header className="grid gap-4 p-3 not-first:border-t">
          <h1 className="text-lg font-normal leading-[1.2] [overflow-wrap:anywhere]">{title || "—"}</h1>
        </header>
        <section className="grid grid-cols-[auto_minmax(0,1fr)] border-t-2 border-border p-0">
          <div className="border-r-2 p-3">
            <div className="flex items-center gap-1 text-base font-medium text-[#cc348d]">
              <img src={Ruby.src} alt="คะแนนพิเศษ" className="size-6" />
              {cost}
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-3">
            <div className="flex shrink-0 items-center gap-1">
              <GoPersonFill className="size-4 stroke-[0.25]" />
              <span className="text-sm font-normal">{maxParticipants}</span>
            </div>
            <u className="min-w-0 text-right text-xs [overflow-wrap:anywhere]">{categoryName}</u>
          </div>
        </section>
        <section className="min-w-0 border-t-2 border-border p-3">
          <p className="whitespace-pre-wrap text-xs [overflow-wrap:anywhere]">{des}
          </p>
        </section>
        {buLabels.length > 0 && (
          <section className="border-t-2 border-border p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              BU / สังกัด
            </p>
            <div className="flex flex-wrap gap-1.5">
              {buLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-[#f3e0ff] px-2 py-1 text-[10px] font-semibold text-[#a568cc]"
                >
                  {label}
                </span>
              ))}
            </div>
          </section>
        )}
      </section>
      <section>
        <section className="grid gap-4 p-3 not-first:border-t">
          <div className="flex items-center justify-center gap-2 p-2 border-2 rounded-md text-xs text-center w-full bg-[#58cc02] text-primary-foreground border-[#0003] border-b-4 font-bold">
            Join
          </div>
        </section>
      </section>
    </article>
  );
};
