import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ClipboardCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ApprovalsListPage() {
  const session = await auth();
  const managerId = session!.user!.id;
  const isAdmin = session!.user!.role === "ADMIN";

  const sheets = await db.goalSheet.findMany({
    where: isAdmin
      ? { status: "SUBMITTED" }
      : { status: "SUBMITTED", employee: { managerId } },
    include: { employee: { include: { department: true } }, approval: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <>
      <AppHeader title="Goal approvals" subtitle="Review team submissions" />
      <main className="flex-1 p-6">
        {sheets.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="All caught up"
            description="No goal sheets waiting for your approval."
            actionLabel="Back to dashboard"
            actionHref="/manager"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pending ({sheets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100">
                {sheets.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-slate-900">{s.employee.name}</p>
                      <p className="text-sm text-slate-500">
                        {s.employee.department?.name ?? "—"} ·{" "}
                        {s.submittedAt ? formatDate(s.submittedAt) : "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Submitted</Badge>
                      <Button size="sm" asChild>
                        <Link href={`/manager/approvals/${s.id}`}>Review</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
