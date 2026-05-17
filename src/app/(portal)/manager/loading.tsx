import { AppHeader } from "@/components/layout/app-header";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function ManagerDashboardLoading() {
  return (
    <>
      <AppHeader title="Manager dashboard" subtitle="Loading…" />
      <DashboardSkeleton />
    </>
  );
}
