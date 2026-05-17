import type { CyclePhase, Quarter, UomType } from "@prisma/client";

export const MAX_GOALS = 8;
export const MIN_WEIGHTAGE = 10;
export const TOTAL_WEIGHTAGE = 100;

export const UOM_LABELS: Record<UomType, string> = {
  NUMERIC_MIN: "Numeric (higher is better)",
  NUMERIC_MAX: "Numeric (lower is better)",
  PERCENT_MIN: "Percentage (higher is better)",
  PERCENT_MAX: "Percentage (lower is better)",
  TIMELINE: "Timeline (date-based)",
  ZERO_BASED: "Zero-based (zero = success)",
};

export const PHASE_LABELS: Record<CyclePhase, string> = {
  GOAL_SETTING: "Goal setting",
  Q1_CHECKIN: "Q1 check-in",
  Q2_CHECKIN: "Q2 check-in",
  Q3_CHECKIN: "Q3 check-in",
  Q4_CHECKIN: "Q4 / annual check-in",
};

export const QUARTER_LABELS: Record<Quarter, string> = {
  Q1: "Q1 (Jul window)",
  Q2: "Q2 (Oct window)",
  Q3: "Q3 (Jan window)",
  Q4: "Q4 (Mar–Apr window)",
};

export const DEMO_PASSWORD = "GoalPortal@2026";

export const THRUST_AREAS = [
  { name: "Revenue Growth", description: "Top-line and pipeline outcomes" },
  { name: "Operational Excellence", description: "Efficiency, quality, and delivery" },
  { name: "Customer Experience", description: "NPS, retention, and service levels" },
  { name: "People & Culture", description: "Engagement, capability, and safety" },
  { name: "Innovation", description: "New products, platforms, and ways of working" },
];
