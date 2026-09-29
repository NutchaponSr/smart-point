"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  BsCalendarRangeFill,
  BsChatDotsFill,
  BsDownload,
  BsGiftFill,
  BsPeopleFill,
  BsStars,
} from "react-icons/bs";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCRPC } from "@/lib/convex/crpc";

import {
  DAY_MS,
  type DayRange,
  defaultRange,
  MAX_RANGE_MS,
  rangeLabel,
} from "@/modules/dashboard/date-range";
import {
  downloadDashboardExcel,
  downloadDashboardPdf,
} from "@/modules/dashboard/export-report";
import { DateFilter } from "@/modules/transactions/ui/components/date-filter";

import { DashboardCard, formatCount, SectionBadge } from "./dashboard-ui";

type Props = {
  range: DayRange;
  onRangeChange: (range: DayRange) => void;
};

export const KpiSection = ({ range, onRangeChange }: Props) => {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const crpc = useCRPC();
  const [exporting, setExporting] = useState(false);

  const rangeArgs = {
    start: range.from,
    end: range.to + 1,
  };

  const { data, isPending } = useQuery(
    crpc.dashboard.getKpis.queryOptions(rangeArgs),
  );
  const { data: culture } = useQuery(
    crpc.dashboard.getCultureStats.queryOptions(rangeArgs),
  );
  const { data: outcome } = useQuery(
    crpc.dashboard.getOutcomeStats.queryOptions(rangeArgs),
  );

  const loading = isPending || !data;
  const canExport = Boolean(data && culture && outcome) && !exporting;

  const buildReport = () => {
    if (!data || !culture || !outcome) {
      throw new Error(t("export-not-ready"));
    }
    return {
      range,
      kpis: data,
      culture,
      outcome: {
        ...outcome,
        recentTransactions: outcome.recentTransactions.map((row) => ({
          ...row,
          tags: row.tags ?? "",
        })),
      },
    };
  };

  const onExportExcel = () => {
    try {
      setExporting(true);
      downloadDashboardExcel(buildReport());
      toast.success(t("export-excel-success"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("export-excel-error"),
      );
    } finally {
      setExporting(false);
    }
  };

  const onExportPdf = () => {
    try {
      setExporting(true);
      downloadDashboardPdf(buildReport());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("export-pdf-error"),
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-md border-2 border-[#e5e5e5] border-b-4 bg-white p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-lg font-extrabold text-[#4b4b4b]">
            {t("system-title")}
          </h2>
          <p className="text-sm font-bold text-[#777]">{t("audience")}</p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!canExport}
              >
                <BsDownload className="size-4 stroke-[0.3]" />
                {exporting ? t("exporting") : t("export")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuItem onSelect={onExportExcel}>
                {t("export-excel")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportPdf}>
                {t("export-pdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionBadge index={1} title={t("section1-title")} />
        <DateFilter
          from={range.from}
          to={range.to}
          onChange={({ from, to }) => {
            if (from == null) {
              onRangeChange(defaultRange());
              return;
            }
            const end = to ?? from + DAY_MS - 1;
            const clampedEnd = Math.min(end, from + MAX_RANGE_MS - 1);
            onRangeChange({ from, to: clampedEnd });
          }}
        >
          <Button type="button" size="sm">
            <BsCalendarRangeFill className="text-[#1cb0f6]" />
            {rangeLabel(range.from, range.to, locale)}
          </Button>
        </DateFilter>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard>
          <p className="flex items-center gap-2 text-sm font-bold text-[#777]">
            <BsPeopleFill className="size-4 text-[#1cb0f6]" />
            {t("kpi.first-login")}
          </p>
          <p className="text-3xl font-extrabold text-[#4b4b4b]">
            {loading ? "…" : formatCount(data.login.firstLoginCount, locale)}{" "}
            <span className="text-base font-bold">{t("people")}</span>
          </p>
          <p className="text-sm font-bold text-[#777]">
            {loading
              ? "…"
              : t("kpi.first-login-hint", {
                  total: formatCount(data.login.totalEmployees, locale),
                })}
          </p>
        </DashboardCard>

        <DashboardCard>
          <p className="flex items-center gap-2 text-sm font-bold text-[#777]">
            <BsChatDotsFill className="size-4 text-[#ffc800]" />
            {t("kpi.praise-sent")}
          </p>
          <p className="text-3xl font-extrabold text-[#4b4b4b]">
            {loading ? "…" : formatCount(data.praise.total, locale)}{" "}
            <span className="text-base font-bold">{t("points")}</span>
          </p>
          <p className="text-sm font-bold text-[#4b4b4b]">
            {t("kpi.praise")}:{" "}
            {loading ? "…" : formatCount(data.praise.praisePoints, locale)}{" "}
            <span className="text-[#afafaf]">|</span> {t("kpi.activity")}:{" "}
            {loading ? "…" : formatCount(data.praise.eventPoints, locale)}
          </p>
        </DashboardCard>

        <DashboardCard>
          <p className="flex items-center gap-2 text-sm font-bold text-[#777]">
            <BsStars className="size-4 text-[#58cc02]" />
            {t("kpi.event-participants")}
          </p>
          <p className="text-3xl font-extrabold text-[#4b4b4b]">
            {loading ? "…" : formatCount(data.events.participantCount, locale)}{" "}
            <span className="text-base font-bold">{t("people")}</span>
          </p>
          <p className="text-sm font-bold text-[#777]">
            {t("kpi.event-participants-hint")}
          </p>
        </DashboardCard>

        <DashboardCard>
          <p className="flex items-center gap-2 text-sm font-bold text-[#777]">
            <BsGiftFill className="size-4 text-[#ff4b4b]" />
            {t("kpi.rewards-redeemed")}
          </p>
          <p className="text-3xl font-extrabold text-[#4b4b4b]">
            {loading
              ? "…"
              : formatCount(data.rewards.redeemedItemCount, locale)}{" "}
            <span className="text-base font-bold">{t("pieces")}</span>
          </p>
          <p className="text-sm font-bold text-[#777]">
            {loading
              ? "…"
              : t("kpi.rewards-value", {
                  points: formatCount(data.rewards.redeemedPoints, locale),
                })}
          </p>
        </DashboardCard>
      </div>
    </div>
  );
};
