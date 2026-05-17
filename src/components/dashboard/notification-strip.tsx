import Link from "next/link";
import { formatRelativeTime } from "@/lib/format-time";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

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
      <p className="text-sm text-slate-500">
        No notifications. You&apos;re up to date.
      </p>
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
              !n.read && "bg-blue-50/60"
            )}
          >
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className={cn("font-medium", !n.read ? "text-slate-900" : "text-slate-700")}>
                {n.title}
              </p>
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
