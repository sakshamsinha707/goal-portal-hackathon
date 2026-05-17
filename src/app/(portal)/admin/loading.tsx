import { AppHeader } from "@/components/layout/app-header";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default function AdminDashboardLoading() {
  return (
    <>
      <AppHeader title="Admin dashboard" subtitle="Loading…" />
      <DashboardSkeleton />
    </>
  );
}
