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
  dashboardQueryArgs,
  formatCount,
  SectionBadge,
} from "./dashboard-ui";

type Props = {
  range: DayRange;
  division: string | null;
};

export const CultureSection = ({ range, division }: Props) => {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const crpc = useCRPC();

  const { data } = useQuery(
    crpc.dashboard.getCultureStats.queryOptions(
      dashboardQueryArgs(range, division, locale),
    ),
  );

  const trend = (data?.trend ?? []).map((row) => ({
    ...row,
    label: formatLocalizedDate(row.date, locale),
  }));
  const praiseAffiliations = data?.praiseAffiliations ?? [];
  const activityAffiliations = data?.activityAffiliations ?? [];

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
                    name === "activityPoints"
                      ? t("culture.tooltip-activity")
                      : t("culture.tooltip-praise"),
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
                  dataKey="praisePoints"
                  stroke="#1cb0f6"
                  strokeWidth={3}
                  fill="#ddf4ff"
                  name="praisePoints"
                />
                <Area
                  type="monotone"
                  dataKey="activityPoints"
                  stroke="#ff9600"
                  strokeWidth={3}
                  fill="#ffe8c2"
                  name="activityPoints"
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
            {t("culture.praise-affiliations-title")}
          </h3>
          {praiseAffiliations.length === 0 ? (
            <p className="text-sm font-bold text-[#afafaf]">
              {t("culture.affiliations-empty")}
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={praiseAffiliations}
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
                    width={72}
                    tick={{ fontSize: 11, fill: "#4b4b4b", fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCount(value, locale),
                      t("culture.tooltip-people"),
                    ]}
                    labelStyle={{ fontWeight: 700, color: "#4b4b4b" }}
                    contentStyle={{
                      border: "2px solid #e5e5e5",
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  />
                  <Bar
                    dataKey="people"
                    name="people"
                    fill="#1cb0f6"
                    radius={[4, 4, 4, 4]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs font-bold text-[#afafaf]">
            {t("culture.praise-affiliations-hint")}
          </p>
        </DashboardCard>

        <DashboardCard>
          <h3 className="text-sm font-extrabold text-[#4b4b4b]">
            {t("culture.activity-affiliations-title")}
          </h3>
          {activityAffiliations.length === 0 ? (
            <p className="text-sm font-bold text-[#afafaf]">
              {t("culture.affiliations-empty")}
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityAffiliations}
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
                    width={72}
                    tick={{ fontSize: 11, fill: "#4b4b4b", fontWeight: 700 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCount(value, locale),
                      t("culture.tooltip-people"),
                    ]}
                    labelStyle={{ fontWeight: 700, color: "#4b4b4b" }}
                    contentStyle={{
                      border: "2px solid #e5e5e5",
                      borderRadius: 8,
                      fontWeight: 700,
                    }}
                  />
                  <Bar
                    dataKey="people"
                    name="people"
                    fill="#ff9600"
                    radius={[4, 4, 4, 4]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs font-bold text-[#afafaf]">
            {t("culture.activity-affiliations-hint")}
          </p>
        </DashboardCard>
      </div>
    </DashboardPanel>
  );
};
