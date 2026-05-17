import Link from "next/link";
import { auth } from "@/lib/auth";
import { getManagerDashboard } from "@/lib/dashboard-data";
import { AppHeader } from "@/components/layout/app-header";
import { StatCard } from "@/components/stat-card";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ApprovalHistoryList } from "@/components/dashboard/approval-history";
import { NotificationStrip } from "@/components/dashboard/notification-strip";
import { TeamProgressChart } from "@/components/dashboard/team-progress-chart";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format-time";
import { Users, ClipboardCheck, AlertTriangle, Clock } from "lucide-react";
import { QUARTER_LABELS } from "@/lib/constants";

export default async function ManagerDashboardPage() {
  const session = await auth();
  const data = await getManagerDashboard(session!.user!.id);

  return (
    <>
      <AppHeader
        title="Manager dashboard"
        subtitle="Team goals, approvals & check-ins"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Direct reports" value={data.teamCount} hint="Active team members" icon={Users} />
          <StatCard
            label="Pending approvals"
            value={data.pendingApprovals}
            hint={
              data.pendingApprovals > 0
                ? `${data.pendingSheets.length} sheet(s) in queue`
                : "Queue clear"
            }
            icon={ClipboardCheck}
            tone={data.pendingApprovals ? "warning" : "success"}
          />
          <StatCard
            label="Check-in gaps"
            value={data.overdueCheckIns.length}
            hint={
              data.activeQuarter
                ? `${QUARTER_LABELS[data.activeQuarter]} follow-up`
                : "No active quarter"
            }
            icon={AlertTriangle}
            tone={data.overdueCheckIns.length ? "danger" : "success"}
          />
          <StatCard
            label="Unread alerts"
            value={data.unreadCount}
            hint={data.unreadCount ? "Open items" : "Inbox clear"}
            icon={Clock}
            tone={data.unreadCount ? "warning" : "success"}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <DashboardPanel
              title="Pending goal sheets"
              subtitle={`${data.pendingSheets.length} awaiting your review`}
              actionLabel="Approval queue"
              actionHref="/manager/approvals"
              meta={data.pendingSheets.length}
              compact
            >
              {data.pendingSheets.length === 0 ? (
                <p className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 px-3 py-6 text-center text-sm text-slate-500">
                  No submissions waiting. You&apos;ll be notified when someone submits.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.pendingSheets.map((s) => (
                    <li
                      key={s.id}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {s.employee.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Submitted{" "}
                          {s.submittedAt
                            ? formatRelativeTime(s.submittedAt)
                            : "recently"}
                          {" - "}
                          {s.cycle.label}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/manager/approvals/${s.id}`}>Review</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Recent approvals"
              subtitle="Last completed reviews"
              actionLabel="All approvals"
              actionHref="/manager/approvals"
              meta={data.recentApprovals.length}
              compact
            >
              <ApprovalHistoryList
                items={data.recentApprovals}
                reviewHref={(id) => `/manager/approvals/${id}`}
              />
            </DashboardPanel>

            <DashboardPanel title="Team activity" meta={data.activity.length} compact>
              <ActivityFeed
                items={data.activity}
                emptyTitle="No team activity yet"
                emptyDescription="Check-ins and goal updates from your reports appear here."
                dense
              />
            </DashboardPanel>
          </div>

          <div className="space-y-4">
            <DashboardPanel
              title="Overdue check-ins"
              subtitle="Approved goals missing this quarter"
              actionLabel="Review check-ins"
              actionHref="/manager/check-ins"
              meta={data.overdueCheckIns.length}
              compact
            >
              {data.overdueCheckIns.length === 0 ? (
                <p className="text-sm text-slate-500">
                  All direct reports are up to date for the active quarter.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.overdueCheckIns.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">{e.name}</span>
                      <Link
                        href="/manager/check-ins"
                        className="text-xs font-medium text-amber-800 hover:underline"
                      >
                        Follow up
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardPanel>

            <DashboardPanel title="Team achievement" compact>
              <TeamProgressChart data={data.teamProgress} />
            </DashboardPanel>

            <DashboardPanel
              title="Notifications"
              actionLabel="View all"
              actionHref="/notifications"
              meta={data.notifications.filter((n) => !n.read).length}
              compact
            >
              <NotificationStrip items={data.notifications} />
            </DashboardPanel>
          </div>
        </div>
      </main>
    </>
  );
}
