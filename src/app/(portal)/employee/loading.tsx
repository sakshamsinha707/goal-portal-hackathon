import { AppHeader } from "@/components/layout/app-header";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function EmployeeDashboardLoading() {
  return (
    <>
      <AppHeader title="Employee dashboard" subtitle="Loading…" />
      <DashboardSkeleton />
    </>
  );
}
