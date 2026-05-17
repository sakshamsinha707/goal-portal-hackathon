"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";

export function AdminDeptChart({
  data,
}: {
  data: { department: string; achievement: number; headcount: number }[];
}) {
  if (!data.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No department data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="department" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="achievement" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AdminStatusChart({
  data,
}: {
  data: { label: string; count: number }[];
}) {
  return <MiniBarChart data={data} height={120} />;
}
