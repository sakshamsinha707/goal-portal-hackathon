import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEmployeeDashboard } from "@/lib/dashboard-data";
import { AppHeader } from "@/components/layout/app-header";
import { StatCard } from "@/components/stat-card";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { GoalProgressBars } from "@/components/dashboard/goal-progress-bars";
import { NotificationStrip } from "@/components/dashboard/notification-strip";
import { PendingActions } from "@/components/dashboard/pending-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cycleStatusMessage } from "@/lib/cycles";
import { PHASE_LABELS, QUARTER_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format-time";
import { Target, Bell, ClipboardCheck, CalendarClock } from "lucide-react";

export default async function EmployeeDashboardPage() {
  const session = await auth();
  const data = await getEmployeeDashboard(session!.user!.id);

  const statusLabel = data.sheet?.status ?? "Not started";
  const phaseMsg = data.cycle
    ? cycleStatusMessage(data.cycle.phase, data.cycle.windowStart, data.cycle.windowEnd)
    : "No active cycle";

  return (
    <>
      <AppHeader
        title="Employee dashboard"
        subtitle={
          data.cycle
            ? `${data.cycle.label} · ${PHASE_LABELS[data.cycle.phase]}`
            : "Performance goals & check-ins"
        }
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Goal sheet" value={statusLabel.replace("_", " ")} icon={Target} />
          <StatCard
            label="Weighted progress"
            value={`${data.overallProgress}%`}
            hint={data.sheet?.status === "APPROVED" ? "From latest check-ins" : "After approval"}
            icon={ClipboardCheck}
          />
          <StatCard label="Unread alerts" value={data.unreadCount} icon={Bell} />
          <StatCard
            label="Goals defined"
            value={data.sheet?.goals.length ?? 0}
            hint="Max 8 per cycle"
            icon={Target}
          />
        </div>

        {data.checkInDue && data.activeQuarter ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  {QUARTER_LABELS[data.activeQuarter]} check-in due
                </p>
                <p className="text-xs text-amber-800">
                  Log planned vs actual before the review window closes.
                </p>
              </div>
            </div>
            <Button size="sm" asChild>
              <Link href="/check-ins">Update progress</Link>
            </Button>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <DashboardPanel
              title="Your actions"
              subtitle="Items that need attention this cycle"
              compact
            >
              <PendingActions items={data.pendingActions} />
            </DashboardPanel>

            <DashboardPanel
              title="Goal progress"
              subtitle={
                data.sheet?.status === "APPROVED"
                  ? "Tracking only — not a performance rating"
                  : "Available after manager approval"
              }
              actionLabel={data.sheet ? "Open sheet" : undefined}
              actionHref="/goals"
              compact
            >
              {data.sheet?.status === "APPROVED" ? (
                <GoalProgressBars goals={data.goalProgress} />
              ) : (
                <p className="text-sm text-slate-500">
                  Submit and get your goal sheet approved to unlock quarterly tracking.
                </p>
              )}
            </DashboardPanel>

            <DashboardPanel title="Activity" subtitle="Your recent updates" compact>
              <ActivityFeed
                items={data.activity}
                emptyDescription="Submit goals or log a check-in to see activity here."
              />
            </DashboardPanel>
          </div>

          <div className="space-y-4">
            <DashboardPanel title="Cycle status" compact>
              <p className="text-sm text-slate-600">{phaseMsg}</p>
              {data.sheet?.submittedAt ? (
                <p className="mt-2 text-xs text-slate-500">
                  Submitted {formatDateTime(data.sheet.submittedAt)}
                </p>
              ) : null}
              {data.sheet?.rejectionNote ? (
                <Badge variant="warning" className="mt-2">
                  {data.sheet.rejectionNote}
                </Badge>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href="/goals">Open goal sheet</Link>
                </Button>
                {data.sheet?.status === "APPROVED" ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/check-ins">Check-ins</Link>
                  </Button>
                ) : null}
              </div>
            </DashboardPanel>

            <DashboardPanel
              title="Notifications"
              actionLabel="View all"
              actionHref="/notifications"
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
