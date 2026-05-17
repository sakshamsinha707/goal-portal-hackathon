import { cn, formatPercent } from "@/lib/utils";

export function GoalProgressBars({
  goals,
}: {
  goals: { id: string; title: string; weightage: number; progress: number; status: string }[];
}) {
  if (!goals.length) {
    return <p className="text-sm text-slate-500">No goals to display yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {goals.map((g) => (
        <li key={g.id}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium text-slate-700">{g.title}</span>
            <span className="shrink-0 text-slate-500">
              {formatPercent(g.progress)} · {g.weightage}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                g.progress >= 80
                  ? "bg-emerald-600"
                  : g.progress >= 50
                    ? "bg-slate-700"
                    : "bg-amber-500"
              )}
              style={{ width: `${Math.min(100, Math.max(0, g.progress))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
