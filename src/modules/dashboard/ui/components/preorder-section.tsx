"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { BsChatDotsFill, BsGiftFill, BsHeartFill } from "react-icons/bs";
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

import { useCRPC } from "@/lib/convex/crpc";

import type { DayRange } from "@/modules/dashboard/date-range";
import { tags as smartCultureTags } from "@/modules/transactions/constants";

import {
  DashboardCard,
  DashboardPanel,
  formatBaht,
  formatCount,
  SectionBadge,
} from "./dashboard-ui";

type Props = {
  range: DayRange;
};

function tagLabel(tagId: string | null | undefined): string | null {
  if (!tagId?.trim()) return null;
  return smartCultureTags[tagId] ?? tagId;
}

export const PreorderSection = ({ range }: Props) => {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const crpc = useCRPC();

  const { data, dataUpdatedAt, isPending } = useQuery(
    crpc.dashboard.getOutcomeStats.queryOptions({
      start: range.from,
      end: range.to + 1,
    }),
  );

  const loading = isPending || !data;
  const topRewards = data?.topRewards ?? [];
  const distribution = data?.distribution ?? [];
  const donation = data?.donation;
  const recent = data?.recentTransactions ?? [];
  const nowMs = dataUpdatedAt || Date.now();

  const relativeTime = (createdAt: number) => {
    const diffSec = Math.max(0, Math.floor((nowMs - createdAt) / 1000));
    if (diffSec < 60) return t("outcome.relative-seconds", { count: diffSec });
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t("outcome.relative-minutes", { count: diffMin });
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return t("outcome.relative-hours", { count: diffHour });
    return t("outcome.relative-days", { count: Math.floor(diffHour / 24) });
  };

  return (
    <DashboardPanel>
      <SectionBadge index={3} title={t("section3-title")} />

      <div className="grid gap-4">
        <DashboardCard>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#4b4b4b]">
            <BsGiftFill className="text-[#ff9600]" />
            {t("outcome.top-rewards")}
          </h3>
          {loading ? (
            <p className="text-sm font-bold text-[#afafaf]">{t("loading")}</p>
          ) : topRewards.length === 0 ? (
            <p className="text-sm font-bold text-[#afafaf]">
              {t("outcome.top-rewards-empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {topRewards.map((reward, index) => (
                <li
                  key={reward.rewardId}
                  className="flex items-center justify-between gap-2 rounded-md border-2 border-[#e5e5e5] bg-white px-2 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-[#4b4b4b]">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-[#ddf4ff] text-[10px] font-extrabold text-[#1cb0f6]">
                      {index + 1}
                    </span>
                    <span className="truncate">{reward.name}</span>
                  </span>
                  <span className="shrink-0 text-xs font-extrabold text-[#ffc800]">
                    {formatCount(reward.quantity, locale)} {t("pieces")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard>
          <h3 className="text-sm font-extrabold text-[#4b4b4b]">
            {t("outcome.distribution-title")}
          </h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distribution}
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
                  width={28}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#777", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCount(value, locale),
                    t("outcome.people-count"),
                  ]}
                  labelStyle={{ fontWeight: 700, color: "#4b4b4b" }}
                  contentStyle={{
                    border: "2px solid #e5e5e5",
                    borderRadius: 8,
                    fontWeight: 700,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                  {distribution.map((entry) => (
                    <Cell key={entry.label} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs font-bold text-[#afafaf]">
            {t("outcome.distribution-hint")}
          </p>
        </DashboardCard>

        <DashboardCard>
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#4b4b4b]">
            <BsHeartFill className="text-[#ff4b4b]" />
            {t("outcome.donation-title")}
          </h3>
          <p className="text-xs font-bold text-[#777]">
            {t("outcome.donation-note")}
          </p>
          <p className="text-2xl font-extrabold text-[#58cc02]">
            {loading ? "…" : formatCount(donation?.points ?? 0, locale)}{" "}
            <span className="text-sm">{t("points")}</span>
          </p>
          <div>
            <p className="text-xs font-bold text-[#777]">
              {t("outcome.donation-value")}
            </p>
            <p className="text-2xl font-extrabold text-[#4b4b4b]">
              {loading ? "…" : formatBaht(donation?.baht ?? 0, locale)}
            </p>
          </div>
          <p className="text-xs font-bold text-[#afafaf]">
            {loading ? "…" : formatCount(donation?.count ?? 0, locale)}{" "}
            {t("items")}
          </p>
        </DashboardCard>
      </div>

      <DashboardCard>
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#4b4b4b]">
          <BsChatDotsFill className="text-[#1cb0f6]" />
          {t("outcome.feed-title")}
        </h3>
        {loading ? (
          <p className="text-sm font-bold text-[#afafaf]">{t("loading")}</p>
        ) : recent.length === 0 ? (
          <p className="text-sm font-bold text-[#afafaf]">
            {t("outcome.feed-empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {recent.map((item) => {
              const cultureTag = tagLabel(item.tags);
              return (
                <li
                  key={item.id}
                  className="rounded-md border-2 border-[#e5e5e5] border-l-4 border-l-[#1cb0f6] bg-white p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-bold text-[#4b4b4b]">
                      {item.sender.name}{" "}
                      <span className="text-[#1cb0f6]">
                        ({item.sender.department})
                      </span>
                      {" @ "}
                      {item.receiver.name}{" "}
                      <span className="text-[#1cb0f6]">
                        ({item.receiver.department})
                      </span>
                    </p>
                    <span className="text-xs font-bold text-[#afafaf]">
                      {relativeTime(item.createdAt)} ·{" "}
                      {formatCount(item.amount, locale)} {t("points")}
                    </span>
                  </div>
                  {item.message ? (
                    <p className="mt-1 text-sm font-medium leading-snug text-[#4b4b4b]">
                      “{item.message}”
                    </p>
                  ) : null}
                  {cultureTag ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-[#ddf4ff] px-2 py-0.5 text-xs font-bold text-[#1cb0f6]">
                        {cultureTag}
                      </span>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </DashboardCard>
    </DashboardPanel>
  );
};
