import { MAX_GOALS, MIN_WEIGHTAGE, TOTAL_WEIGHTAGE } from "@/lib/constants";

export type GoalDraft = {
  title: string;
  description?: string;
  thrustAreaId: string;
  uomType: string;
  target: number;
  weightage: number;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateGoalDrafts(goals: GoalDraft[]): ValidationResult {
  if (!goals.length) {
    return { ok: false, message: "Add at least one goal before submitting." };
  }
  if (goals.length > MAX_GOALS) {
    return { ok: false, message: `Maximum ${MAX_GOALS} goals allowed per employee.` };
  }

  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);
  if (totalWeight !== TOTAL_WEIGHTAGE) {
    return {
      ok: false,
      message: `Total weightage must equal ${TOTAL_WEIGHTAGE}% (currently ${totalWeight}%).`,
    };
  }

  const underMin = goals.find((g) => g.weightage < MIN_WEIGHTAGE);
  if (underMin) {
    return {
      ok: false,
      message: `Each goal must be at least ${MIN_WEIGHTAGE}% weightage.`,
    };
  }

  for (const g of goals) {
    if (!g.title.trim()) {
      return { ok: false, message: "Every goal needs a title." };
    }
    if (!g.thrustAreaId) {
      return { ok: false, message: "Select a thrust area for each goal." };
    }
    if (g.target < 0) {
      return { ok: false, message: "Target cannot be negative." };
    }
  }

  return { ok: true };
}

export function validateSharedWeightageOnly(
  goal: { isShared: boolean; title: string; target: number },
  patch: Partial<GoalDraft>
): ValidationResult {
  if (!goal.isShared) return { ok: true };
  if (patch.title && patch.title !== goal.title) {
    return { ok: false, message: "Shared goal title is read-only." };
  }
  if (patch.target !== undefined && patch.target !== goal.target) {
    return { ok: false, message: "Shared goal target is read-only." };
  }
  return { ok: true };
}
