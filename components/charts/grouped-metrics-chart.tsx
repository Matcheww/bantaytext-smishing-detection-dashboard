"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface GroupedDataPoint {
  name: string;
  precision: number;
  recall: number;
  f1: number;
}

export function GroupedMetricsChart({ data }: { data: GroupedDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-zinc-600 dark:fill-zinc-400" />
        <YAxis
          domain={[0, 1]}
          tickFormatter={(v: number) => v.toFixed(1)}
          tick={{ fontSize: 12 }}
          width={40}
          className="fill-zinc-600 dark:fill-zinc-400"
        />
        <Tooltip
          formatter={(value) => Number(value).toFixed(3)}
          contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="precision" name="Precision" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="recall" name="Recall" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={28} />
        <Bar dataKey="f1" name="F1-score" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
