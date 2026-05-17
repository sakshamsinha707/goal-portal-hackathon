import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { formatRelativeTime } from "@/lib/format-time";
import type { ActivityItem } from "@/lib/dashboard-data";
import { Activity, CheckCircle2, FileText, Bell, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const kindIcon = {
  submit: FileText,
  approve: CheckCircle2,
  reject: AlertCircle,
  checkin: Activity,
  system: Activity,
  notify: Bell,
} as const;

export function ActivityFeed({
  items,
  emptyTitle = "No recent activity",
  emptyDescription = "Updates from your team and system will appear here.",
}: {
  items: ActivityItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!items.length) {
    return (
      <EmptyState
        icon={Activity}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => {
        const Icon = kindIcon[item.kind] ?? Activity;
        const row = (
          <div
            className={cn(
              "flex gap-3 py-2.5 transition-colors",
              item.href && "group hover:bg-slate-50 -mx-2 px-2 rounded-md"
            )}
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-slate-200">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
              <p className="truncate text-xs text-slate-500">{item.detail}</p>
            </div>
            <time className="shrink-0 text-xs text-slate-400" dateTime={item.at.toISOString()}>
              {formatRelativeTime(item.at)}
            </time>
          </div>
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <Link href={item.href} className="block">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}
