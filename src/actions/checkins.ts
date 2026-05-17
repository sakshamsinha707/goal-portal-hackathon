"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { computeProgressScore } from "@/lib/progress";
import { canAccessManager } from "@/lib/permissions";
import { phaseToQuarter } from "@/lib/cycles";
import type { GoalProgressStatus, Quarter } from "@prisma/client";

type CheckInInput = {
  goalId: string;
  quarter: Quarter;
  plannedValue?: number | null;
  actualValue?: number | null;
  status: GoalProgressStatus;
  employeeNotes?: string;
  timelineDate?: string | null;
};

export async function saveCheckIn(input: CheckInInput) {
  const session = await requireSession();
  const goal = await db.goal.findUnique({
    where: { id: input.goalId },
    include: { goalSheet: true },
  });
  if (!goal) throw new Error("Goal not found.");
  if (goal.goalSheet.employeeId !== session.user.id) {
    throw new Error("You can only update your own check-ins.");
  }
  if (goal.goalSheet.status !== "APPROVED") {
    throw new Error("Check-ins are available after goals are approved.");
  }

  const timelineDate = input.timelineDate ? new Date(input.timelineDate) : null;
  const progressScore = computeProgressScore(
    goal.uomType,
    goal.target,
    input.actualValue ?? undefined,
    timelineDate,
    new Date(2027, 3, 30)
  );

  const checkIn = await db.quarterlyCheckIn.upsert({
    where: { goalId_quarter: { goalId: input.goalId, quarter: input.quarter } },
    create: {
      goalId: input.goalId,
      quarter: input.quarter,
      plannedValue: input.plannedValue,
      actualValue: input.actualValue,
      status: input.status,
      employeeNotes: input.employeeNotes?.trim() || null,
      timelineDate,
      progressScore,
    },
    update: {
      plannedValue: input.plannedValue,
      actualValue: input.actualValue,
      status: input.status,
      employeeNotes: input.employeeNotes?.trim() || null,
      timelineDate,
      progressScore,
    },
  });

  if (goal.syncGroupId && goal.isPrimaryOwner) {
    await syncSharedGoalAchievements(goal.syncGroupId, input.quarter);
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: "QuarterlyCheckIn",
    entityId: checkIn.id,
    action: "SAVE",
    summary: `Saved ${input.quarter} check-in`,
  });

  revalidatePath("/check-ins");
  return { ok: true, progressScore };
}

export async function addManagerComment(checkInId: string, comment: string) {
  const session = await requireSession();
  if (!canAccessManager(session.user)) throw new Error("Managers only.");

  const checkIn = await db.quarterlyCheckIn.findUnique({
    where: { id: checkInId },
    include: { goal: { include: { goalSheet: { include: { employee: true } } } } },
  });
  if (!checkIn) throw new Error("Check-in not found.");

  const emp = checkIn.goal.goalSheet.employee;
  if (session.user.role !== "ADMIN" && emp.managerId !== session.user.id) {
    throw new Error("Not your direct report.");
  }

  await db.managerCheckInComment.upsert({
    where: { checkInId },
    create: {
      checkInId,
      managerId: session.user.id,
      comment: comment.trim(),
    },
    update: { comment: comment.trim(), managerId: session.user.id },
  });

  await notifyEmployeeOfComment(emp.id, emp.name, checkIn.goal.title);

  revalidatePath("/manager/check-ins");
  return { ok: true };
}

async function notifyEmployeeOfComment(userId: string, _name: string, goalTitle: string) {
  const { notifyUser } = await import("@/lib/notifications");
  await notifyUser({
    userId,
    title: "Manager feedback",
    message: `New comment on "${goalTitle}" check-in.`,
    href: "/check-ins",
  });
}

export async function syncSharedGoalAchievements(syncGroupId: string, quarter: Quarter) {
  const primaryGoals = await db.goal.findMany({
    where: { syncGroupId, isPrimaryOwner: true },
    include: { checkIns: { where: { quarter } } },
  });

  for (const primary of primaryGoals) {
    const source = primary.checkIns[0];
    if (!source) continue;

    const mirrors = await db.goal.findMany({
      where: { syncGroupId, isPrimaryOwner: false },
    });

    for (const mirror of mirrors) {
      await db.quarterlyCheckIn.upsert({
        where: { goalId_quarter: { goalId: mirror.id, quarter } },
        create: {
          goalId: mirror.id,
          quarter,
          plannedValue: source.plannedValue,
          actualValue: source.actualValue,
          status: source.status,
          progressScore: source.progressScore,
          timelineDate: source.timelineDate,
        },
        update: {
          plannedValue: source.plannedValue,
          actualValue: source.actualValue,
          status: source.status,
          progressScore: source.progressScore,
          timelineDate: source.timelineDate,
        },
      });
    }
  }

  return { ok: true };
}

export async function getEmployeeCheckIns() {
  const session = await requireSession();
  const activeCycle = await db.performanceCycle.findFirst({
    where: { isActive: true },
  });
  const quarter = activeCycle ? phaseToQuarter(activeCycle.phase) ?? "Q1" : "Q1";

  const sheet = await db.goalSheet.findFirst({
    where: {
      employeeId: session.user.id,
      status: "APPROVED",
    },
    include: {
      goals: {
        include: {
          thrustArea: true,
          checkIns: { include: { managerComment: { include: { manager: true } } } },
        },
        orderBy: { sortOrder: "asc" },
      },
      cycle: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return { sheet, quarter };
}

export async function getManagerTeamCheckIns() {
  const session = await requireSession();
  if (!canAccessManager(session.user)) throw new Error("Managers only.");

  const reports = await db.user.findMany({
    where: { managerId: session.user.id },
    include: {
      goalSheets: {
        where: { status: "APPROVED" },
        include: {
          goals: {
            include: {
              checkIns: { include: { managerComment: true } },
              thrustArea: true,
            },
          },
        },
        take: 1,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return reports;
}
