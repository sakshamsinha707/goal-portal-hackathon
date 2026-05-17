import { getOrCreateGoalSheet } from "@/actions/goals";
import { AppHeader } from "@/components/layout/app-header";
import { GoalEditor } from "@/components/goal-editor";
import { cycleStatusMessage } from "@/lib/cycles";
import { PHASE_LABELS } from "@/lib/constants";

export default async function GoalsPage() {
  const { sheet, thrustAreas, cycle } = await getOrCreateGoalSheet();

  const initialGoals = sheet.goals.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description ?? undefined,
    thrustAreaId: g.thrustAreaId,
    uomType: g.uomType,
    target: g.target,
    weightage: g.weightage,
    isShared: g.isShared,
  }));

  return (
    <>
      <AppHeader
        title="My goal sheet"
        subtitle={`${cycle.label} · ${PHASE_LABELS[cycle.phase]} · ${cycleStatusMessage(cycle.phase, cycle.windowStart, cycle.windowEnd)}`}
      />
      <main className="flex-1 p-6">
        <GoalEditor
          sheetId={sheet.id}
          status={sheet.status}
          locked={sheet.locked}
          initialGoals={initialGoals}
          thrustAreas={thrustAreas}
          rejectionNote={sheet.rejectionNote}
        />
      </main>
    </>
  );
}
