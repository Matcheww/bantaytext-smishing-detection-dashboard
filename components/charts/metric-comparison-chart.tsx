"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DataPoint {
  name: string;
  value: number;
}

type ValueFormat = "score" | "percent" | "megabytes";

interface MetricComparisonChartProps {
  data: DataPoint[];
  /**
   * Format applied to the axis and tooltip. A named format (rather than a
   * formatter function) is used so this component can be safely rendered
   * from Server Component pages — functions cannot cross the server/client
   * boundary as props.
   */
  valueFormat?: ValueFormat;
  domain?: [number, number];
  color?: string;
}

const DEFAULT_COLOR = "#3f3f46"; // zinc-700

function formatByType(value: number, format: ValueFormat): string {
  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(0)}%`;
    case "megabytes":
      return `${value.toFixed(0)} MB`;
    case "score":
    default:
      return value.toFixed(3);
  }
}

export function MetricComparisonChart({
  data,
  valueFormat = "score",
  domain,
  color = DEFAULT_COLOR,
}: MetricComparisonChartProps) {
  const formatValue = (v: number) => formatByType(v, valueFormat);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="fill-zinc-600 dark:fill-zinc-400"
        />
        <YAxis
          domain={domain ?? ["auto", "auto"]}
          tickFormatter={formatValue}
          tick={{ fontSize: 12 }}
          width={56}
          className="fill-zinc-600 dark:fill-zinc-400"
        />
        <Tooltip
          formatter={(value) => formatValue(Number(value))}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--color-chart-border, #e4e4e7)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={64} />
      </BarChart>
    </ResponsiveContainer>
  );
}
