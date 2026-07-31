"use client";

import { ApiOutputs } from "@convex/api";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { PinIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Checkbox } from "@/components/ui/checkbox";
import { pickLocalized } from "@/lib/i18n/localized";
import { NewsActions } from "@/modules/news/ui/components/news-actions";

type NewsRow = ApiOutputs["news"]["getList"]["page"][0];

const getDateFnsLocale = (locale: string) => (locale === "th" ? th : enUS);

function NewsTitleCell({ news }: { news: NewsRow }) {
  const locale = useLocale();
  const title = pickLocalized(news.title, locale);
  const summary = pickLocalized(news.summary, locale);

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        {news.isPinned && (
          <PinIcon className="size-3.5 shrink-0 text-pink" />
        )}
        <span className="line-clamp-1 text-base font-normal">{title}</span>
      </div>
      {summary && (
        <span className="line-clamp-1 text-sm text-muted-foreground">
          {summary}
        </span>
      )}
    </div>
  );
}

function NewsStatusCell({ published }: { published: boolean }) {
  const t = useTranslations("news.admin.columns");
  return (
    <span
      className={
        published
          ? "text-sm font-medium text-[#58cc02]"
          : "text-sm text-muted-foreground"
      }
    >
      {published ? t("published") : t("draft")}
    </span>
  );
}

function NewsPublishedAtCell({ publishedAt }: { publishedAt: number | null }) {
  const locale = useLocale();
  return (
    <span className="text-base font-normal">
      {publishedAt
        ? format(new Date(publishedAt), "d MMM yyyy", {
            locale: getDateFnsLocale(locale),
          })
        : "—"}
    </span>
  );
}

function ColumnHeader({
  labelKey,
}: {
  labelKey: "title" | "status" | "published-at";
}) {
  const t = useTranslations("news.admin.columns");
  return <>{t(labelKey)}</>;
}

export const columns = (): ColumnDef<NewsRow>[] => {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          onClick={(e) => e.stopPropagation()}
          className="size-5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="size-5"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: () => <ColumnHeader labelKey="title" />,
      cell: ({ row }) => <NewsTitleCell news={row.original} />,
    },
    {
      accessorKey: "isPublished",
      header: () => <ColumnHeader labelKey="status" />,
      cell: ({ row }) => (
        <NewsStatusCell published={row.original.isPublished} />
      ),
    },
    {
      accessorKey: "publishedAt",
      header: () => <ColumnHeader labelKey="published-at" />,
      cell: ({ row }) => (
        <NewsPublishedAtCell
          publishedAt={row.original.publishedAt ?? null}
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <NewsActions news={row.original} />,
    },
  ];
};
