"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  BsBuildingFill,
  BsCalendarRangeFill,
  BsChatDotsFill,
  BsDownload,
  BsGiftFill,
  BsPeopleFill,
  BsStars,
} from "react-icons/bs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCRPC } from "@/lib/convex/crpc";

import {
  DAY_MS,
  type DayRange,
  defaultRange,
  MAX_RANGE_MS,
  rangeLabel,
} from "@/modules/dashboard/date-range";
import { downloadDashboardExcel } from "@/modules/dashboard/export-report";
import { divisions } from "@/modules/employee/constants";
import { DateFilter } from "@/modules/transactions/ui/components/date-filter";

import {
  DashboardCard,
  dashboardQueryArgs,
  formatCount,
  SectionBadge,
} from "./dashboard-ui";

type Props = {
  range: DayRange;
  division: string | null;
  onRangeChange: (range: DayRange) => void;
  onDivisionChange: (division: string | null) => void;
};

export const KpiSection = ({
  range,
  division,
  onRangeChange,
  onDivisionChange,
}: Props) => {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const crpc = useCRPC();
  const [exporting, setExporting] = useState(false);

  const rangeArgs = dashboardQueryArgs(range, division, locale);

  const { data, isPending, isFetching } = useQuery(
    crpc.dashboard.getKpis.queryOptions(rangeArgs),
  );
  const { data: culture, isFetching: cultureFetching } = useQuery(
    crpc.dashboard.getCultureStats.queryOptions(rangeArgs),
  );
  const { data: outcome, isFetching: outcomeFetching } = useQuery(
    crpc.dashboard.getOutcomeStats.queryOptions(rangeArgs),
  );

  const loading = isPending || !data;
  const canExport =
    Boolean(data && culture && outcome) &&
    !exporting &&
    !isFetching &&
    !cultureFetching &&
    !outcomeFetching;
  const firstLoginByBu = data?.login.byDivision ?? [];

  const divisionLabel = division
    ? (divisions.find((item) => item.slug === division)?.name[
        locale === "en" ? "en" : "th"
      ] ?? division)
    : t("affiliation-all");

  const buildReport = () => {
    if (!data || !culture || !outcome) {
      throw new Error(t("export-not-ready"));
    }
    return {
      range,
      division,
      divisionLabel,
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
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!canExport}
            onClick={onExportExcel}
          >
            <BsDownload className="size-4 stroke-[0.3]" />
            {exporting ? t("exporting") : t("export-excel")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionBadge index={1} title={t("section1-title")} />
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={division ?? ""}
            onValueChange={(value) => onDivisionChange(value || null)}
            items={[
              { value: "", label: t("affiliation-all") },
              ...divisions.map((item) => ({
                value: item.slug,
                label: item.name[locale === "en" ? "en" : "th"],
              })),
            ]}
          >
            <SelectTrigger
              size="sm"
              aria-label={t("affiliation")}
              className="w-auto rounded-md border-2 border-border border-b-4 bg-white font-bold text-[#4b4b4b]"
            >
              <BsBuildingFill className="text-[#1cb0f6]" />
              <SelectValue placeholder={t("affiliation-all")} />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="">{t("affiliation-all")}</SelectItem>
              {divisions.map((item) => (
                <SelectItem key={item.slug} value={item.slug}>
                  {item.name[locale === "en" ? "en" : "th"]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <DashboardCard>
        <h3 className="text-sm font-extrabold text-[#4b4b4b]">
          {t("kpi.first-login-by-bu")}
        </h3>
        {loading ? (
          <p className="text-sm font-bold text-[#afafaf]">{t("loading")}</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={firstLoginByBu}
                layout="vertical"
                margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="#e5e5e5"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#777", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e5e5" }}
                />
                <YAxis
                  type="category"
                  dataKey="affiliation"
                  width={56}
                  tick={{ fontSize: 11, fill: "#4b4b4b", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCount(value, locale),
                    t("people"),
                  ]}
                  labelStyle={{ fontWeight: 700, color: "#4b4b4b" }}
                  contentStyle={{
                    border: "2px solid #e5e5e5",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="people" radius={[4, 4, 4, 4]} barSize={16}>
                  {firstLoginByBu.map((row) => (
                    <Cell
                      key={row.affiliation}
                      fill={
                        !division || division === row.affiliation
                          ? "#1cb0f6"
                          : "#d0d0d0"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-xs font-bold text-[#afafaf]">
          {t("kpi.first-login-by-bu-hint")}
        </p>
      </DashboardCard>
    </div>
  );
};
