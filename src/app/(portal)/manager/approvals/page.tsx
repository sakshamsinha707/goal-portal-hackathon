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
import { formatRelativeTime } from "@/lib/format-time";

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
      <main className="flex-1 p-4 md:p-6">
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
              <CardTitle>Pending reviews ({sheets.length})</CardTitle>
              <p className="text-sm text-slate-500">
                Review weights, targets, and alignment before locking the sheet.
              </p>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100">
                {sheets.map((s) => (
                  <li
                    key={s.id}
                    className="-mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate font-medium text-slate-900">{s.employee.name}</p>
                        <Badge variant="warning">Submitted</Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {s.employee.department?.name ?? "Unassigned"} -{" "}
                        {s.submittedAt ? formatDate(s.submittedAt) : "No date"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Waiting {s.submittedAt ? formatRelativeTime(s.submittedAt) : "recently"}
                      </p>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/manager/approvals/${s.id}`}>Review</Link>
                    </Button>
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
