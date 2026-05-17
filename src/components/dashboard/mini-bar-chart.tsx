"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function MiniBarChart({
  data,
  dataKey = "count",
  labelKey = "label",
  height = 140,
}: {
  data: { label: string; count: number }[];
  dataKey?: string;
  labelKey?: string;
  height?: number;
}) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">No data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey={labelKey}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid #e2e8f0",
          }}
        />
        <Bar dataKey={dataKey} fill="#475569" radius={[3, 3, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
