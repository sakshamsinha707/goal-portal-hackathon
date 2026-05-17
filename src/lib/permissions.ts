import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  role: Role;
  departmentId?: string | null;
};

export function canAccessAdmin(user: SessionUser) {
  return user.role === "ADMIN";
}

export function canAccessManager(user: SessionUser) {
  return user.role === "MANAGER" || user.role === "ADMIN";
}

export function canEditGoalSheet(
  user: SessionUser,
  sheet: { employeeId: string; locked: boolean; status: string }
) {
  if (sheet.employeeId === user.id && !sheet.locked) {
    return sheet.status === "DRAFT" || sheet.status === "REJECTED";
  }
  return false;
}

export function canApproveGoalSheet(
  user: SessionUser,
  sheet: { employee: { managerId: string | null }; status: string }
) {
  if (!canAccessManager(user)) return false;
  if (sheet.status !== "SUBMITTED") return false;
  if (user.role === "ADMIN") return true;
  return sheet.employee.managerId === user.id;
}

export function canUnlockGoals(user: SessionUser) {
  return user.role === "ADMIN";
}

export function canPushSharedGoals(user: SessionUser) {
  return user.role === "ADMIN" || user.role === "MANAGER";
}

export function dashboardPath(role: Role) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MANAGER":
      return "/manager";
    default:
      return "/employee";
  }
}
