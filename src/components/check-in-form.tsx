"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveCheckIn } from "@/actions/checkins";
import { QUARTER_LABELS } from "@/lib/constants";
import { formatPercent } from "@/lib/utils";
import type { Goal, GoalProgressStatus, Quarter, ThrustArea, QuarterlyCheckIn } from "@prisma/client";

type GoalWithCheckIns = Goal & {
  thrustArea: ThrustArea;
  checkIns: (QuarterlyCheckIn & { managerComment?: { comment: string } | null })[];
};

export function CheckInForm({
  goals,
  quarter,
}: {
  goals: GoalWithCheckIns[];
  quarter: Quarter;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Updating {QUARTER_LABELS[quarter]} check-ins for approved goals.
      </p>
      {goals.map((goal) => (
        <GoalCheckInCard key={goal.id} goal={goal} quarter={quarter} />
      ))}
    </div>
  );
}

function GoalCheckInCard({ goal, quarter }: { goal: GoalWithCheckIns; quarter: Quarter }) {
  const existing = goal.checkIns.find((c) => c.quarter === quarter);
  const [status, setStatus] = useState<GoalProgressStatus>(existing?.status ?? "NOT_STARTED");
  const [pending, startTransition] = useTransition();
  const disabled = !goal.isPrimaryOwner && goal.isShared;

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await saveCheckIn({
          goalId: goal.id,
          quarter,
          plannedValue: fd.get("planned") ? parseFloat(fd.get("planned") as string) : null,
          actualValue: fd.get("actual") ? parseFloat(fd.get("actual") as string) : null,
          status,
          employeeNotes: (fd.get("notes") as string) || undefined,
          timelineDate: (fd.get("timeline") as string) || null,
        });
        toast.success("Check-in saved.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-sm">{goal.title}</CardTitle>
          <p className="text-xs text-slate-500">{goal.thrustArea.name}</p>
        </div>
        {goal.isShared ? <Badge variant="info">Shared</Badge> : null}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Planned</Label>
            <Input
              name="planned"
              type="number"
              defaultValue={existing?.plannedValue ?? ""}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>Actual</Label>
            <Input
              name="actual"
              type="number"
              defaultValue={existing?.actualValue ?? ""}
              disabled={disabled}
            />
          </div>
          {goal.uomType === "TIMELINE" ? (
            <div className="space-y-1">
              <Label>Completion date</Label>
              <Input
                name="timeline"
                type="date"
                defaultValue={
                  existing?.timelineDate
                    ? new Date(existing.timelineDate).toISOString().slice(0, 10)
                    : ""
                }
                disabled={disabled}
              />
            </div>
          ) : null}
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as GoalProgressStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_STARTED">Not started</SelectItem>
                <SelectItem value="ON_TRACK">On track</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label>Notes</Label>
            <Textarea name="notes" defaultValue={existing?.employeeNotes ?? ""} />
          </div>
          {existing?.progressScore != null ? (
            <p className="text-sm text-slate-600 sm:col-span-2">
              Progress: {formatPercent(existing.progressScore)}
            </p>
          ) : null}
          {existing?.managerComment ? (
            <p className="rounded-md bg-slate-50 p-2 text-sm text-slate-700 sm:col-span-2">
              Manager: {existing.managerComment.comment}
            </p>
          ) : null}
          <Button type="submit" className="sm:col-span-2 w-fit" disabled={pending || disabled}>
            Save check-in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
