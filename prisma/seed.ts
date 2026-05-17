import "dotenv/config";
import {
  Role,
  GoalSheetStatus,
  CyclePhase,
  UomType,
  ApprovalStatus,
  GoalProgressStatus,
  Quarter,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { THRUST_AREAS, DEMO_PASSWORD } from "../src/lib/constants";
import { buildCycleCalendar } from "../src/lib/cycles";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.managerCheckInComment.deleteMany();
  await prisma.quarterlyCheckIn.deleteMany();
  await prisma.goalApproval.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.sharedGoalTemplate.deleteMany();
  await prisma.performanceCycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.thrustArea.deleteMany();
  await prisma.department.deleteMany();

  const ops = await prisma.department.create({ data: { name: "Operations" } });
  const sales = await prisma.department.create({ data: { name: "Sales" } });
  const eng = await prisma.department.create({ data: { name: "Product Engineering" } });

  const thrustAreas = await Promise.all(
    THRUST_AREAS.map((t) =>
      prisma.thrustArea.create({ data: { name: t.name, description: t.description } })
    )
  );
  const revenue = thrustAreas[0]!;
  const opsEx = thrustAreas[1]!;

  const admin = await prisma.user.create({
    data: {
      email: "admin@atomquest.com",
      passwordHash,
      name: "Priya Sharma",
      role: Role.ADMIN,
      departmentId: ops.id,
    },
  });

  const mgrOps = await prisma.user.create({
    data: {
      email: "manager.ops@atomquest.com",
      passwordHash,
      name: "Rahul Mehta",
      role: Role.MANAGER,
      departmentId: ops.id,
    },
  });

  const mgrSales = await prisma.user.create({
    data: {
      email: "manager.sales@atomquest.com",
      passwordHash,
      name: "Anita Desai",
      role: Role.MANAGER,
      departmentId: sales.id,
    },
  });

  const employees = await Promise.all([
    prisma.user.create({
      data: {
        email: "employee1@atomquest.com",
        passwordHash,
        name: "Vikram Singh",
        role: Role.EMPLOYEE,
        departmentId: ops.id,
        managerId: mgrOps.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "employee2@atomquest.com",
        passwordHash,
        name: "Neha Kapoor",
        role: Role.EMPLOYEE,
        departmentId: ops.id,
        managerId: mgrOps.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "employee3@atomquest.com",
        passwordHash,
        name: "Arjun Patel",
        role: Role.EMPLOYEE,
        departmentId: sales.id,
        managerId: mgrSales.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "employee4@atomquest.com",
        passwordHash,
        name: "Kavya Iyer",
        role: Role.EMPLOYEE,
        departmentId: sales.id,
        managerId: mgrSales.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "employee5@atomquest.com",
        passwordHash,
        name: "Dev Chen",
        role: Role.EMPLOYEE,
        departmentId: eng.id,
        managerId: mgrOps.id,
      },
    }),
  ]);

  const calendar = buildCycleCalendar(2026);
  const cycles = await Promise.all(
    calendar.map((c) =>
      prisma.performanceCycle.create({
        data: {
          year: 2026,
          label: `FY 2026 - ${c.label}`,
          phase: c.phase,
          windowStart: c.windowStart,
          windowEnd: c.windowEnd,
          isActive: c.phase === CyclePhase.GOAL_SETTING,
        },
      })
    )
  );
  const goalCycle = cycles.find((c) => c.phase === CyclePhase.GOAL_SETTING)!;

  const sheet1 = await prisma.goalSheet.create({
    data: {
      employeeId: employees[0]!.id,
      cycleId: goalCycle.id,
      status: GoalSheetStatus.SUBMITTED,
      submittedAt: hoursAgo(3),
      goals: {
        create: [
          {
            title: "Reduce order cycle time",
            description: "End-to-end fulfilment SLA",
            thrustAreaId: opsEx.id,
            uomType: UomType.NUMERIC_MAX,
            target: 48,
            weightage: 40,
            sortOrder: 0,
          },
          {
            title: "Improve CSAT score",
            thrustAreaId: thrustAreas[2]!.id,
            uomType: UomType.PERCENT_MIN,
            target: 85,
            weightage: 35,
            sortOrder: 1,
          },
          {
            title: "Complete safety training",
            thrustAreaId: thrustAreas[3]!.id,
            uomType: UomType.ZERO_BASED,
            target: 0,
            weightage: 25,
            sortOrder: 2,
          },
        ],
      },
    },
    include: { goals: true },
  });

  await prisma.goalApproval.create({
    data: {
      goalSheetId: sheet1.id,
      managerId: mgrOps.id,
      status: ApprovalStatus.PENDING,
    },
  });

  const sheet2 = await prisma.goalSheet.create({
    data: {
      employeeId: employees[1]!.id,
      cycleId: goalCycle.id,
      status: GoalSheetStatus.APPROVED,
      submittedAt: daysAgo(4),
      approvedAt: daysAgo(2),
      locked: true,
      goals: {
        create: [
          {
            title: "Pipeline coverage ratio",
            thrustAreaId: revenue.id,
            uomType: UomType.PERCENT_MIN,
            target: 120,
            weightage: 50,
            sortOrder: 0,
          },
          {
            title: "Launch partner onboarding playbook",
            thrustAreaId: thrustAreas[4]!.id,
            uomType: UomType.TIMELINE,
            target: 1,
            weightage: 50,
            sortOrder: 1,
          },
        ],
      },
    },
    include: { goals: true },
  });

  await prisma.goalApproval.create({
    data: {
      goalSheetId: sheet2.id,
      managerId: mgrOps.id,
      status: ApprovalStatus.APPROVED,
      reviewedAt: daysAgo(2),
      managerNotes: "Approved after tightening partner onboarding milestone.",
    },
  });

  for (const goal of sheet2.goals) {
    await prisma.quarterlyCheckIn.create({
      data: {
        goalId: goal.id,
        quarter: Quarter.Q1,
        plannedValue: goal.target * 0.25,
        actualValue: goal.uomType === UomType.TIMELINE ? null : goal.target * 0.3,
        status: GoalProgressStatus.ON_TRACK,
        progressScore: 75,
        employeeNotes: "On track for Q1",
        timelineDate: goal.uomType === UomType.TIMELINE ? new Date(2026, 6, 15) : null,
      },
    });
  }

  const sheetDev = await prisma.goalSheet.create({
    data: {
      employeeId: employees[4]!.id,
      cycleId: goalCycle.id,
      status: GoalSheetStatus.APPROVED,
      submittedAt: daysAgo(5),
      approvedAt: daysAgo(3),
      locked: true,
      goals: {
        create: [
          {
            title: "Stabilize release handoff checklist",
            description: "Reduce missed deployment prerequisites",
            thrustAreaId: opsEx.id,
            uomType: UomType.PERCENT_MIN,
            target: 95,
            weightage: 45,
            sortOrder: 0,
          },
          {
            title: "Improve incident response notes",
            thrustAreaId: thrustAreas[4]!.id,
            uomType: UomType.TIMELINE,
            target: 1,
            weightage: 55,
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.goalApproval.create({
    data: {
      goalSheetId: sheetDev.id,
      managerId: mgrOps.id,
      status: ApprovalStatus.APPROVED,
      reviewedAt: daysAgo(3),
      managerNotes: "Approved with Q1 check-in expected before the review close.",
    },
  });

  await prisma.sharedGoalTemplate.create({
    data: {
      departmentId: ops.id,
      thrustAreaId: thrustAreas[2]!.id,
      title: "Department NPS uplift",
      description: "Shared across Operations",
      uomType: UomType.PERCENT_MIN,
      target: 70,
      syncGroupId: "shared-ops-nps-2026",
      createdById: admin.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: mgrOps.id,
        title: "3 goals pending approval",
        message: "Vikram Singh submitted a goal sheet for your review.",
        href: `/manager/approvals/${sheet1.id}`,
        createdAt: hoursAgo(2),
      },
      {
        userId: employees[0]!.id,
        title: "Goal sheet submitted",
        message: "Your goals are with Rahul Mehta for approval.",
        href: "/goals",
        createdAt: hoursAgo(2),
      },
      {
        userId: employees[1]!.id,
        title: "Goals approved",
        message: "Your FY 2026 goal sheet was approved.",
        href: "/goals",
        read: true,
        createdAt: hoursAgo(48),
      },
      {
        userId: employees[1]!.id,
        title: "Quarterly review reminder",
        message: "Q1 check-in window is open - log planned vs actual.",
        href: "/check-ins",
        createdAt: hoursAgo(5),
      },
      {
        userId: mgrOps.id,
        title: "Check-in overdue",
        message: "Dev Chen has not logged Q1 progress yet.",
        href: "/manager/check-ins",
        createdAt: hoursAgo(8),
      },
      {
        userId: employees[4]!.id,
        title: "Q1 check-in pending",
        message: "Your approved goals need a Q1 progress update.",
        href: "/check-ins",
        createdAt: hoursAgo(9),
      },
      {
        userId: mgrOps.id,
        title: "Approval completed",
        message: "Neha Kapoor's goal sheet was approved and locked.",
        href: "/manager/approvals",
        read: true,
        createdAt: daysAgo(2),
      },
      {
        userId: admin.id,
        title: "Org snapshot ready",
        message: "FY 2026 goal setting cycle is active.",
        href: "/admin",
        createdAt: hoursAgo(24),
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        userId: employees[0]!.id,
        entityType: "GoalSheet",
        entityId: sheet1.id,
        action: "SUBMIT",
        summary: "Vikram Singh submitted goal sheet for FY 2026",
        createdAt: hoursAgo(2),
      },
      {
        userId: mgrOps.id,
        entityType: "GoalSheet",
        entityId: sheet2.id,
        action: "APPROVE",
        summary: "Rahul Mehta approved Neha Kapoor goal sheet",
        createdAt: hoursAgo(36),
      },
      {
        userId: employees[1]!.id,
        entityType: "QuarterlyCheckIn",
        entityId: sheet2.goals[0]!.id,
        action: "CHECKIN",
        summary: "Neha Kapoor updated Q1 KPI progress",
        createdAt: hoursAgo(6),
      },
      {
        userId: mgrOps.id,
        entityType: "GoalSheet",
        entityId: sheetDev.id,
        action: "APPROVE",
        summary: "Rahul Mehta approved Dev Chen goal sheet",
        createdAt: daysAgo(3),
      },
      {
        userId: employees[4]!.id,
        entityType: "QuarterlyCheckIn",
        entityId: sheetDev.id,
        action: "REMINDER",
        summary: "Q1 check-in reminder sent to Dev Chen",
        createdAt: hoursAgo(9),
      },
      {
        userId: admin.id,
        entityType: "System",
        entityId: "seed",
        action: "SEED",
        summary: "Database seeded with demo users and goals",
        createdAt: hoursAgo(72),
      },
    ],
  });

  await prisma.escalation.createMany({
    data: [
      {
        type: "CHECKIN_OVERDUE",
        userId: employees[4]!.id,
        message: "Dev Chen - Q1 check-in not completed within window",
        createdAt: hoursAgo(12),
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Admin:", admin.email);
  console.log("Managers:", mgrOps.email, mgrSales.email);
  console.log("Employees:", employees.map((e) => e.email).join(", "));
  console.log("Password:", DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
