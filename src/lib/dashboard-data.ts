import { db } from "@/lib/db";
import { weightedAchievement } from "@/lib/progress";
import { phaseToQuarter } from "@/lib/cycles";
export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  at: Date;
  href?: string;
  kind: "submit" | "approve" | "reject" | "checkin" | "system" | "notify";
};

export async function getEmployeeDashboard(userId: string) {
  const [sheet, cycle, notifications, auditForUser] = await Promise.all([
    db.goalSheet.findFirst({
      where: { employeeId: userId },
      include: {
        cycle: true,
        goals: { include: { checkIns: true, thrustArea: true } },
        approval: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.performanceCycle.findFirst({ where: { isActive: true } }),
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const activeQuarter = cycle ? phaseToQuarter(cycle.phase) : null;
  const checkInDue =
    sheet?.status === "APPROVED" &&
    activeQuarter &&
    sheet.goals.some(
      (g) => !g.checkIns.find((c) => c.quarter === activeQuarter)
    );

  const goalProgress = (sheet?.goals ?? []).map((g) => {
    const latest = [...g.checkIns].sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
    return {
      id: g.id,
      title: g.title,
      weightage: g.weightage,
      progress: latest?.progressScore ?? 0,
      status: latest?.status ?? "NOT_STARTED",
    };
  });

  const overallProgress =
    goalProgress.length > 0
      ? Math.round(
          weightedAchievement(
            goalProgress.map((g) => ({ weightage: g.weightage, progressScore: g.progress }))
          )
        )
      : 0;

  const activity: ActivityItem[] = [
    ...notifications.map((n) => ({
      id: `n-${n.id}`,
      title: n.title,
      detail: n.message,
      at: n.createdAt,
      href: n.href ?? undefined,
      kind: "notify" as const,
    })),
    ...auditForUser.map((a) => ({
      id: `a-${a.id}`,
      title: a.action,
      detail: a.summary,
      at: a.createdAt,
      kind: "system" as const,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  const pendingActions: { label: string; href: string; priority: "high" | "normal" }[] = [];
  if (!sheet || sheet.status === "DRAFT") {
    pendingActions.push({
      label: "Complete and submit your goal sheet",
      href: "/goals",
      priority: "high",
    });
  }
  if (sheet?.status === "REJECTED") {
    pendingActions.push({
      label: "Revise goals after manager feedback",
      href: "/goals",
      priority: "high",
    });
  }
  if (sheet?.status === "SUBMITTED") {
    pendingActions.push({
      label: "Waiting for manager approval",
      href: "/goals",
      priority: "normal",
    });
  }
  if (checkInDue) {
    pendingActions.push({
      label: `Log ${activeQuarter} achievement before window closes`,
      href: "/check-ins",
      priority: "high",
    });
  }

  return {
    sheet,
    cycle,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    goalProgress,
    overallProgress,
    activity,
    pendingActions,
    checkInDue: !!checkInDue,
    activeQuarter,
  };
}

export async function getManagerDashboard(managerId: string) {
  const teamIds = (
    await db.user.findMany({
      where: { managerId },
      select: { id: true },
    })
  ).map((u) => u.id);

  const [
    teamCount,
    pendingApprovals,
    pendingSheets,
    recentApprovals,
    teamAudit,
    teamSheets,
    notifications,
  ] = await Promise.all([
    db.user.count({ where: { managerId } }),
    db.goalApproval.count({ where: { managerId, status: "PENDING" } }),
    db.goalSheet.findMany({
      where: { employee: { managerId }, status: "SUBMITTED" },
      include: { employee: true, cycle: true },
      orderBy: { submittedAt: "desc" },
      take: 8,
    }),
    db.goalApproval.findMany({
      where: {
        managerId,
        status: { in: ["APPROVED", "REJECTED"] },
        reviewedAt: { not: null },
      },
      include: { goalSheet: { include: { employee: true } } },
      orderBy: { reviewedAt: "desc" },
      take: 6,
    }),
    db.auditLog.findMany({
      where: { userId: { in: teamIds } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: true },
    }),
    db.goalSheet.findMany({
      where: { employeeId: { in: teamIds }, status: "APPROVED" },
      include: {
        employee: true,
        goals: { include: { checkIns: true } },
      },
    }),
    db.notification.findMany({
      where: { userId: managerId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const cycle = await db.performanceCycle.findFirst({ where: { isActive: true } });
  const activeQuarter = cycle ? phaseToQuarter(cycle.phase) : null;

  const overdueCheckIns = teamSheets
    .filter((sheet) => {
      if (!activeQuarter) return false;
      return sheet.goals.some(
        (g) => !g.checkIns.find((c) => c.quarter === activeQuarter)
      );
    })
    .map((s) => ({
      id: s.id,
      name: s.employee.name,
      employeeId: s.employeeId,
    }))
    .slice(0, 6);

  const teamProgress = teamSheets.map((sheet) => {
    const scores = sheet.goals.map((g) => {
      const latest = [...g.checkIns].sort((a, b) =>
        b.quarter.localeCompare(a.quarter)
      )[0];
      return { weightage: g.weightage, progressScore: latest?.progressScore ?? null };
    });
    return {
      name: sheet.employee.name,
      achievement: Math.round(weightedAchievement(scores)),
    };
  });

  const activity: ActivityItem[] = [
    ...teamAudit.map((a) => ({
      id: a.id,
      title: a.user.name,
      detail: a.summary,
      at: a.createdAt,
      kind: "checkin" as const,
    })),
    ...notifications.map((n) => ({
      id: `n-${n.id}`,
      title: n.title,
      detail: n.message,
      at: n.createdAt,
      href: n.href ?? undefined,
      kind: "notify" as const,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10);

  return {
    teamCount,
    pendingApprovals,
    pendingSheets,
    recentApprovals,
    overdueCheckIns,
    teamProgress,
    activity,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    cycle,
    activeQuarter,
  };
}

export async function getAdminDashboardData() {
  const base = await import("@/actions/admin").then((m) => m.getAdminStats());

  const [recentApprovals, orgActivity, escalations, checkInGaps] = await Promise.all([
    db.goalApproval.findMany({
      where: { reviewedAt: { not: null } },
      include: {
        manager: true,
        goalSheet: { include: { employee: true } },
      },
      orderBy: { reviewedAt: "desc" },
      take: 8,
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: true },
    }),
    db.escalation.count({ where: { resolved: false } }),
    db.goalSheet.count({ where: { status: "APPROVED" } }),
  ]);

  const statusChart = [
    { label: "Draft", count: base.statusMap.DRAFT ?? 0 },
    { label: "Submitted", count: base.statusMap.SUBMITTED ?? 0 },
    { label: "Approved", count: base.statusMap.APPROVED ?? 0 },
    { label: "Rejected", count: base.statusMap.REJECTED ?? 0 },
  ];

  const activity: ActivityItem[] = orgActivity.map((a) => ({
    id: a.id,
    title: a.user.name,
    detail: a.summary,
    at: a.createdAt,
    kind: a.action === "APPROVE" ? "approve" : a.action === "SUBMIT" ? "submit" : "system",
  }));

  return {
    ...base,
    recentApprovals,
    activity,
    escalations,
    approvedSheets: checkInGaps,
    statusChart,
  };
}
