"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { approveGoalSheet, rejectGoalSheet } from "@/actions/approvals";
import type { GoalDraft } from "@/lib/validations/goals";
import type { GoalSheetStatus } from "@prisma/client";

export function ApprovalPanel({
  sheetId,
  employeeName,
  status,
  initialGoals,
}: {
  sheetId: string;
  employeeName: string;
  status: GoalSheetStatus;
  initialGoals: GoalDraft[];
}) {
  const [goals, setGoals] = useState(initialGoals);
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [pending, startTransition] = useTransition();
  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0);

  if (status !== "SUBMITTED") {
    return (
      <p className="rounded-md border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
        This sheet is {status.toLowerCase()} - no action required.
      </p>
    );
  }

  function updateGoal(index: number, patch: Partial<GoalDraft>) {
    setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  }

  function handleApprove() {
    startTransition(async () => {
      try {
        await approveGoalSheet(sheetId, goals);
        toast.success(`Approved goals for ${employeeName}.`);
        window.location.href = "/manager/approvals";
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Approval failed.");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectGoalSheet(sheetId, rejectNote);
        toast.success("Returned to employee.");
        window.location.href = "/manager/approvals";
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Reject failed.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-slate-100 p-2 text-slate-600">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Review package</p>
            <p className="text-xs text-slate-500">
              {goals.length} goals submitted by {employeeName}
            </p>
          </div>
        </div>
        <Badge variant={totalWeight === 100 ? "success" : "warning"}>
          Total weight: {totalWeight}%
        </Badge>
      </div>

      {goals.map((goal, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-sm">Goal {index + 1}</CardTitle>
            {goal.description ? (
              <p className="text-xs text-slate-500">{goal.description}</p>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Title</Label>
              <Input
                value={goal.title}
                onChange={(e) => updateGoal(index, { title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Target</Label>
              <Input
                type="number"
                value={goal.target}
                onChange={(e) =>
                  updateGoal(index, { target: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Weight %</Label>
              <Input
                type="number"
                value={goal.weightage}
                onChange={(e) =>
                  updateGoal(index, { weightage: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {showReject ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <Label>Return reason</Label>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Explain what needs to change..."
          />
          <div className="flex gap-2">
            <Button variant="destructive" disabled={pending} onClick={handleReject}>
              Confirm return
            </Button>
            <Button variant="outline" onClick={() => setShowReject(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-4 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <Button disabled={pending} onClick={handleApprove}>
            <Check className="h-4 w-4" />
            Approve goals
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => setShowReject(true)}>
            <X className="h-4 w-4" />
            Return for edits
          </Button>
        </div>
      )}
    </div>
  );
}
