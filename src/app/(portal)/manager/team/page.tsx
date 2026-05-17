import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ManagerTeamPage() {
  const session = await auth();
  const reports = await db.user.findMany({
    where: { managerId: session!.user!.id },
    include: {
      department: true,
      goalSheets: {
        take: 1,
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { goals: true } } },
      },
    },
  });

  return (
    <>
      <AppHeader title="My team" subtitle="Direct reports & goal status" />
      <main className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Direct reports ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {reports.map((r) => {
                const sheet = r.goalSheets[0];
                return (
                  <li key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-sm text-slate-500">{r.department?.name}</p>
                    </div>
                    <Badge
                      variant={
                        sheet?.status === "APPROVED"
                          ? "success"
                          : sheet?.status === "SUBMITTED"
                            ? "warning"
                            : "default"
                      }
                    >
                      {sheet?.status ?? "No sheet"} · {sheet?._count.goals ?? 0} goals
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
