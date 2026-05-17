"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/permissions";
import { weightedAchievement } from "@/lib/progress";

export async function getAdminStats() {
  const session = await requireSession();
  if (!canAccessAdmin(session.user)) throw new Error("Admin only.");

  const [
    userCount,
    sheetCounts,
    pendingApprovals,
    departments,
    recentAudit,
  ] = await Promise.all([
    db.user.count(),
    db.goalSheet.groupBy({ by: ["status"], _count: true }),
    db.goalApproval.count({ where: { status: "PENDING" } }),
    db.department.findMany({
      include: {
        _count: { select: { users: true } },
        sharedGoals: true,
      },
    }),
    db.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ]);

  const approvedSheets = await db.goalSheet.findMany({
    where: { status: "APPROVED" },
    include: {
      goals: { include: { checkIns: true } },
      employee: { include: { department: true } },
    },
  });

  const deptScores: Record<string, { total: number; count: number }> = {};
  for (const sheet of approvedSheets) {
    const dept = sheet.employee.department?.name ?? "Unassigned";
    const scores = sheet.goals.map((g) => {
      const latest = g.checkIns.sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
      return { weightage: g.weightage, progressScore: latest?.progressScore ?? null };
    });
    const achievement = weightedAchievement(scores);
    if (!deptScores[dept]) deptScores[dept] = { total: 0, count: 0 };
    deptScores[dept].total += achievement;
    deptScores[dept].count += 1;
  }

  const chartData = Object.entries(deptScores).map(([name, v]) => ({
    department: name,
    achievement: v.count ? Math.round(v.total / v.count) : 0,
    headcount: departments.find((d) => d.name === name)?._count.users ?? 0,
  }));

  const statusMap = Object.fromEntries(
    sheetCounts.map((s) => [s.status, s._count])
  );

  return {
    userCount,
    pendingApprovals,
    statusMap,
    chartData,
    recentAudit,
    departments: departments.map((d) => ({
      name: d.name,
      users: d._count.users,
      sharedGoals: d.sharedGoals.length,
    })),
  };
}

export async function getAuditLogs(limit = 50) {
  const session = await requireSession();
  if (!canAccessAdmin(session.user)) throw new Error("Admin only.");

  return db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
}

export async function exportReportCsv() {
  const session = await requireSession();
  if (!canAccessAdmin(session.user)) throw new Error("Admin only.");

  const sheets = await db.goalSheet.findMany({
    include: {
      employee: { include: { department: true, manager: true } },
      cycle: true,
      goals: { include: { thrustArea: true, checkIns: true } },
    },
  });

  const headers = [
    "Employee",
    "Email",
    "Department",
    "Manager",
    "Cycle",
    "Sheet Status",
    "Goal",
    "Thrust Area",
    "Weight %",
    "Target",
    "Latest Quarter",
    "Progress %",
  ];

  const rows: string[][] = [];
  for (const sheet of sheets) {
    for (const goal of sheet.goals) {
      const latest = goal.checkIns.sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
      rows.push([
        sheet.employee.name,
        sheet.employee.email,
        sheet.employee.department?.name ?? "",
        sheet.employee.manager?.name ?? "",
        sheet.cycle.label,
        sheet.status,
        goal.title,
        goal.thrustArea.name,
        String(goal.weightage),
        String(goal.target),
        latest?.quarter ?? "",
        latest?.progressScore != null ? String(Math.round(latest.progressScore)) : "",
      ]);
    }
  }

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  return csv;
}

export async function markNotificationRead(id: string) {
  const session = await requireSession();
  await db.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  return { ok: true };
}

export async function getNotifications() {
  const session = await requireSession();
  return db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}
