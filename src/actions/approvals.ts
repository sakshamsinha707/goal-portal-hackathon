"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { validateGoalDrafts, type GoalDraft } from "@/lib/validations/goals";
import { canApproveGoalSheet } from "@/lib/permissions";
import type { UomType } from "@prisma/client";

export async function approveGoalSheet(
  sheetId: string,
  goalEdits?: GoalDraft[],
  managerNotes?: string
) {
  const session = await requireSession();
  const sheet = await db.goalSheet.findUnique({
    where: { id: sheetId },
    include: { employee: true, goals: true, approval: true },
  });
  if (!sheet) throw new Error("Goal sheet not found.");
  if (!canApproveGoalSheet(session.user, sheet)) {
    throw new Error("You cannot approve this goal sheet.");
  }

  const drafts: GoalDraft[] = (goalEdits ?? sheet.goals.map((g) => ({
    title: g.title,
    description: g.description ?? undefined,
    thrustAreaId: g.thrustAreaId,
    uomType: g.uomType,
    target: g.target,
    weightage: g.weightage,
  })));

  const validation = validateGoalDrafts(drafts);
  if (!validation.ok) throw new Error(validation.message);

  await db.$transaction(async (tx) => {
    if (goalEdits) {
      await tx.goal.deleteMany({ where: { goalSheetId: sheetId } });
      await tx.goal.createMany({
        data: drafts.map((g, i) => ({
          goalSheetId: sheetId,
          title: g.title.trim(),
          description: g.description?.trim() || null,
          thrustAreaId: g.thrustAreaId,
          uomType: g.uomType as UomType,
          target: g.target,
          weightage: g.weightage,
          isShared: sheet.goals[i]?.isShared ?? false,
          sharedTemplateId: sheet.goals[i]?.sharedTemplateId,
          syncGroupId: sheet.goals[i]?.syncGroupId,
          isPrimaryOwner: sheet.goals[i]?.isPrimaryOwner ?? true,
          sortOrder: i,
        })),
      });
    }

    await tx.goalSheet.update({
      where: { id: sheetId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        locked: true,
        rejectionNote: null,
      },
    });

    await tx.goalApproval.update({
      where: { goalSheetId: sheetId },
      data: {
        status: "APPROVED",
        managerNotes: managerNotes?.trim() || null,
        reviewedAt: new Date(),
      },
    });

    const goals = await tx.goal.findMany({ where: { goalSheetId: sheetId } });
    for (const goal of goals) {
      for (const q of ["Q1", "Q2", "Q3", "Q4"] as const) {
        await tx.quarterlyCheckIn.upsert({
          where: { goalId_quarter: { goalId: goal.id, quarter: q } },
          create: { goalId: goal.id, quarter: q },
          update: {},
        });
      }
    }
  });

  await notifyUser({
    userId: sheet.employeeId,
    title: "Goals approved",
    message: "Your manager approved your FY goal sheet.",
    href: "/goals",
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: "GoalSheet",
    entityId: sheetId,
    action: "APPROVE",
    summary: `Approved goal sheet for ${sheet.employee.name}`,
  });

  revalidatePath("/manager/approvals");
  revalidatePath(`/manager/approvals/${sheetId}`);
  revalidatePath("/manager");
  return { ok: true };
}

export async function rejectGoalSheet(sheetId: string, note: string) {
  const session = await requireSession();
  const sheet = await db.goalSheet.findUnique({
    where: { id: sheetId },
    include: { employee: true },
  });
  if (!sheet) throw new Error("Goal sheet not found.");
  if (!canApproveGoalSheet(session.user, sheet)) {
    throw new Error("You cannot reject this goal sheet.");
  }
  if (!note.trim()) throw new Error("Please provide a rejection reason.");

  await db.$transaction(async (tx) => {
    await tx.goalSheet.update({
      where: { id: sheetId },
      data: {
        status: "REJECTED",
        rejectionNote: note.trim(),
        locked: false,
      },
    });
    await tx.goalApproval.update({
      where: { goalSheetId: sheetId },
      data: {
        status: "REJECTED",
        managerNotes: note.trim(),
        reviewedAt: new Date(),
      },
    });
  });

  await notifyUser({
    userId: sheet.employeeId,
    title: "Goals returned",
    message: "Your manager requested changes to your goal sheet.",
    href: "/goals",
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: "GoalSheet",
    entityId: sheetId,
    action: "REJECT",
    summary: `Rejected goal sheet for ${sheet.employee.name}`,
    after: { note },
  });

  revalidatePath("/manager/approvals");
  revalidatePath(`/manager/approvals/${sheetId}`);
  return { ok: true };
}
