import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessAdmin } from "@/lib/permissions";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { AppHeader } from "@/components/layout/app-header";
import { StatCard } from "@/components/stat-card";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ApprovalHistoryList } from "@/components/dashboard/approval-history";
import { AdminDeptChart, AdminStatusChart } from "@/components/dashboard/admin-charts";
import { Badge } from "@/components/ui/badge";
import { Users, ClipboardCheck, Building2, Shield } from "lucide-react";
import { formatRelativeTime } from "@/lib/format-time";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || !canAccessAdmin(session.user)) {
    redirect("/employee");
  }

  const data = await getAdminDashboardData();

  return (
    <>
      <AppHeader
        title="Admin dashboard"
        subtitle="Org-wide performance & governance"
      />
      <main className="flex-1 space-y-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Users" value={data.userCount} icon={Users} />
          <StatCard
            label="Pending approvals"
            value={data.pendingApprovals}
            hint="Across all managers"
            icon={ClipboardCheck}
          />
          <StatCard
            label="Departments"
            value={data.departments.length}
            icon={Building2}
          />
          <StatCard
            label="Open escalations"
            value={data.escalations}
            hint="Rule-based follow-ups"
            icon={Shield}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <DashboardPanel
              title="Avg achievement by department"
              subtitle="From latest quarterly check-ins"
              compact
            >
              <AdminDeptChart data={data.chartData} />
            </DashboardPanel>

            <DashboardPanel
              title="Goal sheet pipeline"
              subtitle="Status across the organization"
              compact
            >
              <AdminStatusChart data={data.statusChart} />
            </DashboardPanel>

            <DashboardPanel
              title="Org activity"
              subtitle="Audit trail highlights"
              actionLabel="Full audit log"
              actionHref="/audit"
              compact
            >
              <ActivityFeed
                items={data.activity}
                emptyDescription="System and user actions are logged here."
              />
            </DashboardPanel>
          </div>

          <div className="space-y-4">
            <DashboardPanel title="Departments" compact>
              <ul className="space-y-2 text-sm">
                {data.departments.map((d) => (
                  <li
                    key={d.name}
                    className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 transition-colors hover:bg-slate-50"
                  >
                    <span className="font-medium text-slate-800">{d.name}</span>
                    <span className="text-xs text-slate-500">
                      {d.users} people · {d.sharedGoals} shared KPIs
                    </span>
                  </li>
                ))}
              </ul>
            </DashboardPanel>

            <DashboardPanel
              title="Recent approvals"
              subtitle="Manager decisions"
              compact
            >
              <ApprovalHistoryList
                items={data.recentApprovals.map((a) => ({
                  id: a.id,
                  status: a.status,
                  reviewedAt: a.reviewedAt,
                  managerNotes: a.managerNotes,
                  goalSheet: a.goalSheet,
                }))}
              />
            </DashboardPanel>

            <DashboardPanel
              title="Audit log"
              actionLabel="View all"
              actionHref="/audit"
              compact
            >
              <ul className="divide-y divide-slate-100 text-sm">
                {data.recentAudit.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-col gap-0.5 py-2 transition-colors hover:bg-slate-50 -mx-2 px-2 rounded-md"
                  >
                    <span className="text-slate-800">{log.summary}</span>
                    <span className="text-xs text-slate-500">
                      {log.user.name} · {formatRelativeTime(log.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
              {data.recentAudit.length === 0 ? (
                <p className="text-sm text-slate-500">No audit entries yet.</p>
              ) : null}
            </DashboardPanel>

            <DashboardPanel title="Governance" compact>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{data.approvedSheets} approved sheets</Badge>
                <Link
                  href="/reports"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Export reports →
                </Link>
              </div>
            </DashboardPanel>
          </div>
        </div>
      </main>
    </>
  );
}
