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
  dense = false,
}: {
  items: ActivityItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  dense?: boolean;
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
        const label = {
          submit: "Submitted",
          approve: "Approved",
          reject: "Returned",
          checkin: "Check-in",
          system: "Audit",
          notify: "Alert",
        }[item.kind];
        const row = (
          <div
            className={cn(
              "flex gap-3 transition-colors",
              dense ? "py-2" : "py-2.5",
              item.href && "group hover:bg-slate-50 -mx-2 px-2 rounded-md"
            )}
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 group-hover:bg-slate-100">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 sm:inline-flex">
                  {label}
                </span>
              </div>
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
