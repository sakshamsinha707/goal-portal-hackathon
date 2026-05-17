"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notifications";
import { canPushSharedGoals } from "@/lib/permissions";
import type { UomType } from "@prisma/client";

type SharedGoalInput = {
  departmentId: string;
  thrustAreaId: string;
  title: string;
  description?: string;
  uomType: UomType;
  target: number;
  defaultWeightage: number;
};

export async function pushSharedGoalToDepartment(input: SharedGoalInput) {
  const session = await requireSession();
  if (!canPushSharedGoals(session.user)) throw new Error("Not allowed.");

  const employees = await db.user.findMany({
    where: { departmentId: input.departmentId, role: "EMPLOYEE" },
    include: {
      goalSheets: {
        where: { status: { in: ["DRAFT", "REJECTED"] } },
        include: { goals: true },
        take: 1,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const syncGroupId = randomUUID();
  const template = await db.sharedGoalTemplate.create({
    data: {
      departmentId: input.departmentId,
      thrustAreaId: input.thrustAreaId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      uomType: input.uomType,
      target: input.target,
      syncGroupId,
      createdById: session.user.id,
    },
  });

  let pushed = 0;
  for (const emp of employees) {
    const sheet = emp.goalSheets[0];
    if (!sheet || sheet.locked) continue;

    const isPrimary = pushed === 0;
    await db.goal.create({
      data: {
        goalSheetId: sheet.id,
        thrustAreaId: input.thrustAreaId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        uomType: input.uomType,
        target: input.target,
        weightage: input.defaultWeightage,
        isShared: true,
        sharedTemplateId: template.id,
        syncGroupId,
        isPrimaryOwner: isPrimary,
        sortOrder: sheet.goals.length,
      },
    });

    await notifyUser({
      userId: emp.id,
      title: "Shared goal added",
      message: `A department goal "${input.title}" was added to your sheet.`,
      href: "/goals",
    });
    pushed++;
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: "SharedGoalTemplate",
    entityId: template.id,
    action: "PUSH",
    summary: `Pushed shared goal to ${pushed} employees in department`,
  });

  revalidatePath("/admin/shared-goals");
  revalidatePath("/goals");
  return { ok: true, pushed, templateId: template.id };
}

export async function listSharedGoalTemplates() {
  await requireSession();
  return db.sharedGoalTemplate.findMany({
    include: { department: true, thrustArea: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listDepartmentsAndThrustAreas() {
  await requireSession();
  const [departments, thrustAreas] = await Promise.all([
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.thrustArea.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { departments, thrustAreas };
}
