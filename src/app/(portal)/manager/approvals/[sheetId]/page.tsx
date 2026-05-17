import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canApproveGoalSheet } from "@/lib/permissions";
import { AppHeader } from "@/components/layout/app-header";
import { ApprovalPanel } from "@/components/approval-panel";

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const { sheetId } = await params;
  const session = await auth();

  const sheet = await db.goalSheet.findUnique({
    where: { id: sheetId },
    include: {
      employee: { include: { department: true } },
      goals: { include: { thrustArea: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!sheet) notFound();
  if (!canApproveGoalSheet(session!.user, sheet) && sheet.status !== "APPROVED") {
    notFound();
  }

  const initialGoals = sheet.goals.map((g) => ({
    title: g.title,
    description: g.description ?? undefined,
    thrustAreaId: g.thrustAreaId,
    uomType: g.uomType,
    target: g.target,
    weightage: g.weightage,
  }));

  return (
    <>
      <AppHeader
        title={sheet.employee.name}
        subtitle={sheet.employee.department?.name ?? "Goal sheet review"}
      />
      <main className="flex-1 p-6">
        <ApprovalPanel
          sheetId={sheet.id}
          employeeName={sheet.employee.name}
          status={sheet.status}
          initialGoals={initialGoals}
        />
      </main>
    </>
  );
}
