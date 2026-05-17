"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { notifyManagerOfSubmission } from "@/lib/notifications";
import { validateGoalDrafts, type GoalDraft } from "@/lib/validations/goals";
import { canEditGoalSheet, canUnlockGoals } from "@/lib/permissions";
import { pickActivePhase } from "@/lib/cycles";
import type { UomType } from "@prisma/client";

export async function getOrCreateGoalSheet() {
  const session = await requireSession();
  const userId = session.user.id;

  const cycles = await db.performanceCycle.findMany({
    where: { year: new Date().getFullYear() >= 2026 ? 2026 : new Date().getFullYear() },
    orderBy: { windowStart: "asc" },
  });

  let cycle = cycles.length ? pickActivePhase(cycles) : null;
  if (!cycle) {
    cycle = await db.performanceCycle.findFirst({ where: { isActive: true } });
  }
  if (!cycle) {
    cycle = await db.performanceCycle.findFirst({ orderBy: { windowStart: "desc" } });
  }
  if (!cycle) throw new Error("No performance cycle configured.");

  const sheet = await db.goalSheet.upsert({
    where: { employeeId_cycleId: { employeeId: userId, cycleId: cycle.id } },
    create: { employeeId: userId, cycleId: cycle.id },
    update: {},
    include: {
      cycle: true,
      goals: { include: { thrustArea: true, checkIns: true }, orderBy: { sortOrder: "asc" } },
      approval: true,
    },
  });

  const thrustAreas = await db.thrustArea.findMany({ orderBy: { name: "asc" } });

  return { sheet, thrustAreas, cycle };
}

export async function saveGoals(sheetId: string, goals: GoalDraft[]) {
  const session = await requireSession();
  const sheet = await db.goalSheet.findUnique({
    where: { id: sheetId },
    include: { goals: true },
  });
  if (!sheet) throw new Error("Goal sheet not found.");
  if (!canEditGoalSheet(session.user, sheet)) {
    throw new Error("You cannot edit this goal sheet.");
  }

  const validation = validateGoalDrafts(goals);
  if (!validation.ok) throw new Error(validation.message);

  await db.$transaction(async (tx) => {
    await tx.goal.deleteMany({ where: { goalSheetId: sheetId } });
    await tx.goal.createMany({
      data: goals.map((g, i) => ({
        goalSheetId: sheetId,
        title: g.title.trim(),
        description: g.description?.trim() || null,
        thrustAreaId: g.thrustAreaId,
        uomType: g.uomType as UomType,
        target: g.target,
        weightage: g.weightage,
        sortOrder: i,
      })),
    });
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: "GoalSheet",
    entityId: sheetId,
    action: "SAVE_DRAFT",
    summary: "Saved goal sheet draft",
    after: { goalCount: goals.length },
  });

  revalidatePath("/goals");
  revalidatePath("/employee");
  return { ok: true };
}

export async function submitGoalSheet(sheetId: string) {
  const session = await requireSession();
  const sheet = await db.goalSheet.findUnique({
    where: { id: sheetId },
    include: {
      goals: { include: { thrustArea: true } },
      employee: { include: { manager: true } },
    },
  });
  if (!sheet) throw new Error("Goal sheet not found.");
  if (!canEditGoalSheet(session.user, sheet)) {
    throw new Error("You cannot submit this goal sheet.");
  }

  const drafts: GoalDraft[] = sheet.goals.map((g) => ({
    title: g.title,
    description: g.description ?? undefined,
    thrustAreaId: g.thrustAreaId,
    uomType: g.uomType,
    target: g.target,
    weightage: g.weightage,
  }));

  const validation = validateGoalDrafts(drafts);
  if (!validation.ok) throw new Error(validation.message);

  const managerId = sheet.employee.managerId;
  if (!managerId) throw new Error("No manager assigned — contact HR.");

  await db.$transaction(async (tx) => {
    await tx.goalSheet.update({
      where: { id: sheetId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        rejectionNote: null,
      },
    });
    await tx.goalApproval.upsert({
      where: { goalSheetId: sheetId },
      create: { goalSheetId: sheetId, managerId, status: "PENDING" },
      update: { managerId, status: "PENDING", reviewedAt: null, managerNotes: null },
    });
  });

  await notifyManagerOfSubmission(managerId, sheet.employee.name, sheetId);

  await writeAuditLog({
    userId: session.user.id,
    entityType: "GoalSheet",
    entityId: sheetId,
    action: "SUBMIT",
    summary: `${session.user.name} submitted goal sheet`,
  });

  revalidatePath("/goals");
  revalidatePath("/manager/approvals");
  revalidatePath("/employee");
  return { ok: true };
}

export async function unlockGoalSheet(sheetId: string) {
  const session = await requireSession();
  if (!canUnlockGoals(session.user)) throw new Error("Admin only.");

  await db.goalSheet.update({
    where: { id: sheetId },
    data: { locked: false, status: "DRAFT" },
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: "GoalSheet",
    entityId: sheetId,
    action: "UNLOCK",
    summary: "Admin unlocked goal sheet for editing",
  });

  revalidatePath("/goals");
  revalidatePath("/admin");
  return { ok: true };
}
