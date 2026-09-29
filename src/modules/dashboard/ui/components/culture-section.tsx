"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCRPC } from "@/lib/convex/crpc";
import { formatLocalizedDate } from "@/lib/format-thai-date";

import type { DayRange } from "@/modules/dashboard/date-range";

import {
  DashboardCard,
  DashboardPanel,
  formatCount,
  SectionBadge,
} from "./dashboard-ui";

type Props = {
  range: DayRange;
};

export const CultureSection = ({ range }: Props) => {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const crpc = useCRPC();

  const { data } = useQuery(
    crpc.dashboard.getCultureStats.queryOptions({
      start: range.from,
      end: range.to + 1,
    }),
  );

  const trend = (data?.trend ?? []).map((row) => ({
    ...row,
    label: formatLocalizedDate(row.date, locale),
  }));
  const departments = data?.topDepartments ?? [];

  return (
    <DashboardPanel>
      <SectionBadge index={2} title={t("section2-title")} />

      <div className="grid gap-4">
        <DashboardCard>
          <h3 className="text-sm font-extrabold text-[#4b4b4b]">
            {t("culture.trend-title")}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trend}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e5e5" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#777", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e5e5" }}
                />
                <YAxis
                  width={44}
                  tick={{ fontSize: 11, fill: "#777", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => formatCount(value, locale)}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCount(value, locale),
                    name === "points"
                      ? t("culture.tooltip-points")
                      : t("culture.tooltip-count"),
                  ]}
                  labelStyle={{ fontWeight: 700, color: "#4b4b4b" }}
                  contentStyle={{
                    border: "2px solid #e5e5e5",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="points"
                  stroke="#1cb0f6"
                  strokeWidth={3}
                  fill="#ddf4ff"
                  name="points"
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#58cc02"
                  strokeWidth={2}
                  fill="transparent"
                  name="count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs font-bold text-[#afafaf]">
            {t("culture.trend-hint")}
          </p>
        </DashboardCard>

        <DashboardCard>
          <h3 className="text-sm font-extrabold text-[#4b4b4b]">
            {t("culture.departments-title")}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departments}
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
                  dataKey="department"
                  width={110}
                  tick={{ fontSize: 11, fill: "#4b4b4b", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCount(value, locale),
                    name === "count"
                      ? t("culture.tooltip-count")
                      : t("culture.tooltip-points"),
                  ]}
                  labelStyle={{ fontWeight: 700, color: "#4b4b4b" }}
                  contentStyle={{
                    border: "2px solid #e5e5e5",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                />
                <Bar
                  dataKey="count"
                  name="count"
                  fill="#58cc02"
                  radius={[4, 4, 4, 4]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs font-bold text-[#afafaf]">
            {t("culture.departments-hint")}
          </p>
        </DashboardCard>
      </div>
    </DashboardPanel>
  );
};
