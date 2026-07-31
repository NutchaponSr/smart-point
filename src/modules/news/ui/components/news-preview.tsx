"use client";

import { format } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { PinIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { pickLocalized } from "@/lib/i18n/localized";
import type { NewsFormInput } from "@/modules/news/schema";

const getDateFnsLocale = (locale: string) => (locale === "th" ? th : enUS);

export const NewsPreview = () => {
  const { control } = useFormContext<NewsFormInput>();
  const values = useWatch({ control });
  const locale = useLocale();
  const t = useTranslations("news.admin");

  const title = pickLocalized(
    values.title
      ? { th: values.title.th ?? "", en: values.title.en ?? "" }
      : null,
    locale,
  );
  const summary = pickLocalized(
    values.summary
      ? { th: values.summary.th ?? "", en: values.summary.en ?? "" }
      : null,
    locale,
  );
  const body = pickLocalized(
    values.body
      ? { th: values.body.th ?? "", en: values.body.en ?? "" }
      : null,
    locale,
  );

  return (
    <article className="flex flex-col gap-4 rounded-md border-2 border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-muted-foreground">
          {t("preview")}
        </h3>
        {values.isPinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-pink/10 px-2 py-0.5 text-xs font-medium text-pink">
            <PinIcon className="size-3" />
            {t("pinned")}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <time className="text-xs text-muted-foreground">
          {format(new Date(), "d MMMM yyyy", {
            locale: getDateFnsLocale(locale),
          })}
        </time>
        <h4 className="text-lg font-bold leading-snug">
          {title || t("preview-title-fallback")}
        </h4>
        {summary && (
          <p className="text-sm text-muted-foreground">{summary}</p>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {body || t("preview-body-fallback")}
        </p>
      </div>

      <div className="border-t border-border pt-3">
        <span
          className={
            values.isPublished
              ? "text-xs font-medium text-[#58cc02]"
              : "text-xs text-muted-foreground"
          }
        >
          {values.isPublished ? t("preview-published") : t("preview-draft")}
        </span>
      </div>
    </article>
  );
};
