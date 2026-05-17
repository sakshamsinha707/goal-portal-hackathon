"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { getManagerTeamCheckIns, addManagerComment } from "@/actions/checkins";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Report = Awaited<ReturnType<typeof getManagerTeamCheckIns>>[number];

export default function ManagerCheckInsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getManagerTeamCheckIns()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  function submitComment(checkInId: string, comment: string) {
    startTransition(async () => {
      try {
        await addManagerComment(checkInId, comment);
        toast.success("Comment saved.");
        const fresh = await getManagerTeamCheckIns();
        setReports(fresh);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed.");
      }
    });
  }

  return (
    <>
      <AppHeader title="Team check-ins" subtitle="Review quarterly progress" />
      <main className="flex-1 space-y-4 p-6">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : reports.length === 0 ? (
          <p className="text-sm text-slate-500">No direct reports with approved goals.</p>
        ) : (
          reports.map((r) => {
            const sheet = r.goalSheets[0];
            if (!sheet) return null;
            return (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sheet.goals.map((goal) =>
                    goal.checkIns.map((ci) => (
                      <div key={ci.id} className="rounded-md border border-slate-100 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{goal.title}</p>
                          <Badge variant="default">{ci.quarter}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Status: {ci.status}
                          {ci.progressScore != null
                            ? ` · ${Math.round(ci.progressScore)}%`
                            : ""}
                        </p>
                        {ci.managerComment ? (
                          <p className="mt-2 text-sm text-slate-600">
                            Your note: {ci.managerComment.comment}
                          </p>
                        ) : (
                          <form
                            className="mt-2 flex gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const fd = new FormData(e.currentTarget);
                              submitComment(ci.id, fd.get("comment") as string);
                            }}
                          >
                            <Textarea name="comment" placeholder="Add feedback..." rows={2} />
                            <Button type="submit" size="sm">
                              Save
                            </Button>
                          </form>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </>
  );
}
