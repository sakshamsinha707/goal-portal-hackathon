import Link from "next/link";
import { getNotifications } from "@/actions/admin";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-time";
import { Bell } from "lucide-react";

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <>
      <AppHeader title="Notifications" />
      <main className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <p className="text-sm text-slate-500">
              Review workflow updates, reminders, and manager actions.
            </p>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="Submission updates, approvals, and check-in reminders will appear here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="-mx-2 rounded-md px-2 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{n.title}</p>
                          {!n.read ? <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> : null}
                        </div>
                        <p className="text-sm text-slate-600">{n.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(n.createdAt)} - {formatRelativeTime(n.createdAt)}
                        </p>
                        {n.href ? (
                          <Link
                            href={n.href}
                            className="mt-1 inline-block text-sm font-medium text-slate-900 hover:underline"
                          >
                            Open
                          </Link>
                        ) : null}
                      </div>
                      {!n.read ? <Badge variant="info">New</Badge> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
