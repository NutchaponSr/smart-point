"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

import { formatCount } from "./dashboard-ui";

export type LabeledBar = {
  label: string;
  value: number;
  color?: string;
};

const DEFAULT_BAR_COLOR = "#8ec5ff";

type Props = {
  data: LabeledBar[];
  locale: string;
  seriesLabel: string;
  className?: string;
};

export const LabeledBarChart = ({
  data,
  locale,
  seriesLabel,
  className,
}: Props) => {
  return (
    <div className={cn("h-56 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          barCategoryGap="22%"
        >
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "#e5e5e5" }}
            interval={0}
            tickMargin={10}
            tick={{ fontSize: 12, fill: "#777", fontWeight: 700 }}
          />
          <YAxis
            hide
            width={0}
            domain={[0, (dataMax: number) => (dataMax <= 0 ? 1 : dataMax * 1.25)]}
          />
          <Tooltip
            cursor={false}
            formatter={(value: number) => [
              formatCount(value, locale),
              seriesLabel,
            ]}
            labelStyle={{ fontWeight: 700, color: "#4b4b4b" }}
            contentStyle={{
              border: "2px solid #e5e5e5",
              borderRadius: 8,
              fontWeight: 700,
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.color ?? DEFAULT_BAR_COLOR}
              />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              offset={8}
              formatter={(value) => formatCount(Number(value) || 0, locale)}
              style={{ fontSize: 12, fontWeight: 700, fill: "#4b4b4b" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
