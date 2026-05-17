import Link from "next/link";
import { getNotifications } from "@/actions/admin";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <>
      <AppHeader title="Notifications" />
      <main className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <li key={n.id} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{n.title}</p>
                        <p className="text-sm text-slate-600">{n.message}</p>
                        <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                        {n.href ? (
                          <Link href={n.href} className="text-sm text-slate-900 underline">
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
