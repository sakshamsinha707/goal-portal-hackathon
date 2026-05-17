import Link from "next/link";
import { formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import { Bell, CheckCircle2 } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  read: boolean;
  createdAt: Date;
};

export function NotificationStrip({ items }: { items: Notification[] }) {
  if (!items.length) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-3 text-sm">
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
        <p className="text-slate-500">No notifications. You&apos;re up to date.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {items.slice(0, 5).map((n) => (
        <li key={n.id}>
          <Link
            href={n.href ?? "/notifications"}
            className={cn(
              "flex gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-slate-50",
              !n.read && "border border-blue-100 bg-blue-50/60"
            )}
          >
            <Bell className={cn("mt-0.5 h-4 w-4 shrink-0", !n.read ? "text-blue-600" : "text-slate-400")} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={cn("truncate font-medium", !n.read ? "text-slate-900" : "text-slate-700")}>
                  {n.title}
                </p>
                {!n.read ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                ) : null}
              </div>
              <p className="truncate text-xs text-slate-500">{n.message}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">
              {formatRelativeTime(n.createdAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
