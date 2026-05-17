"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { exportReportCsv } from "@/actions/admin";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      try {
        const csv = await exportReportCsv();
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `goal-portal-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Report downloaded.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Export failed.");
      }
    });
  }

  return (
    <>
      <AppHeader title="Reports" subtitle="Export org-wide goal data" />
      <main className="flex-1 p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>CSV export</CardTitle>
            <CardDescription>
              Includes employees, goals, check-in progress, and sheet status for all cycles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={pending}>
              <Download className="h-4 w-4" />
              Download report
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
