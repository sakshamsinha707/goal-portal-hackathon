import type { CyclePhase, Quarter } from "@prisma/client";

export function phaseToQuarter(phase: CyclePhase): Quarter | null {
  const map: Partial<Record<CyclePhase, Quarter>> = {
    Q1_CHECKIN: "Q1",
    Q2_CHECKIN: "Q2",
    Q3_CHECKIN: "Q3",
    Q4_CHECKIN: "Q4",
  };
  return map[phase] ?? null;
}

export function isWindowOpen(start: Date, end: Date, now = new Date()) {
  return now >= start && now <= end;
}

export function cycleStatusMessage(
  phase: CyclePhase,
  windowStart: Date,
  windowEnd: Date
): string {
  const now = new Date();
  if (now < windowStart) {
    return `${phase.replace("_", " ").toLowerCase()} opens ${windowStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
  }
  if (now > windowEnd) {
    return "Window closed";
  }
  return "Window open — updates allowed";
}

export function buildCycleCalendar(year: number) {
  return [
    {
      phase: "GOAL_SETTING" as CyclePhase,
      label: "Goal setting",
      windowStart: new Date(year, 4, 1),
      windowEnd: new Date(year, 5, 30),
    },
    {
      phase: "Q1_CHECKIN" as CyclePhase,
      label: "Q1 check-in",
      windowStart: new Date(year, 6, 1),
      windowEnd: new Date(year, 6, 31),
    },
    {
      phase: "Q2_CHECKIN" as CyclePhase,
      label: "Q2 check-in",
      windowStart: new Date(year, 9, 1),
      windowEnd: new Date(year, 9, 31),
    },
    {
      phase: "Q3_CHECKIN" as CyclePhase,
      label: "Q3 check-in",
      windowStart: new Date(year + 1, 0, 1),
      windowEnd: new Date(year + 1, 0, 31),
    },
    {
      phase: "Q4_CHECKIN" as CyclePhase,
      label: "Q4 / annual",
      windowStart: new Date(year + 1, 2, 1),
      windowEnd: new Date(year + 1, 3, 30),
    },
  ];
}

export function pickActivePhase<T extends { phase: CyclePhase; windowStart: Date; windowEnd: Date; isActive: boolean }>(
  cycles: T[]
): T | undefined {
  const flagged = cycles.find((c) => c.isActive);
  if (flagged) return flagged;

  const now = new Date();
  return (
    cycles.find((c) => isWindowOpen(c.windowStart, c.windowEnd, now)) ??
    cycles[0]
  );
}
