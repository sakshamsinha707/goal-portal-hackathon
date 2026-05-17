import type { UomType } from "@prisma/client";

export function computeProgressScore(
  uomType: UomType,
  target: number,
  actual: number | null | undefined,
  timelineDate?: Date | null,
  deadline?: Date | null
): number | null {
  if (actual === null || actual === undefined) return null;

  switch (uomType) {
    case "NUMERIC_MIN":
    case "PERCENT_MIN":
      if (target <= 0) return null;
      return Math.min(100, Math.max(0, (actual / target) * 100));
    case "NUMERIC_MAX":
    case "PERCENT_MAX":
      if (actual <= 0) return actual === 0 && target > 0 ? 100 : 0;
      return Math.min(100, Math.max(0, (target / actual) * 100));
    case "ZERO_BASED":
      return actual === 0 ? 100 : 0;
    case "TIMELINE": {
      if (!timelineDate || !deadline) return null;
      const done = timelineDate.getTime() <= deadline.getTime();
      return done ? 100 : 0;
    }
    default:
      return null;
  }
}

export function weightedAchievement(
  goals: { weightage: number; progressScore: number | null }[]
): number {
  const withScores = goals.filter((g) => g.progressScore !== null);
  if (!withScores.length) return 0;
  const totalWeight = withScores.reduce((s, g) => s + g.weightage, 0);
  if (!totalWeight) return 0;
  return withScores.reduce(
    (s, g) => s + (g.progressScore! * g.weightage) / totalWeight,
    0
  );
}
