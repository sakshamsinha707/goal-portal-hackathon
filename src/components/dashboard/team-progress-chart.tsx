"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function TeamProgressChart({
  data,
}: {
  data: { name: string; achievement: number }[];
}) {
  if (!data.length) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        Team progress appears after goals are approved and check-ins logged.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          tick={{ fontSize: 11, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(v) => [`${v}%`, "Achievement"]} />
        <Bar dataKey="achievement" fill="#334155" radius={[0, 3, 3, 0]} maxBarSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
