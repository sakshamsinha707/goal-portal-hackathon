"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveGoals, submitGoalSheet } from "@/actions/goals";
import { UOM_LABELS } from "@/lib/constants";
import type { GoalDraft } from "@/lib/validations/goals";
import type { ThrustArea, UomType, GoalSheetStatus } from "@prisma/client";

type GoalRow = GoalDraft & { id?: string; isShared?: boolean };

const emptyGoal = (): GoalRow => ({
  title: "",
  description: "",
  thrustAreaId: "",
  uomType: "NUMERIC_MIN",
  target: 0,
  weightage: 10,
});

export function GoalEditor({
  sheetId,
  status,
  locked,
  initialGoals,
  thrustAreas,
  rejectionNote,
}: {
  sheetId: string;
  status: GoalSheetStatus;
  locked: boolean;
  initialGoals: GoalRow[];
  thrustAreas: ThrustArea[];
  rejectionNote?: string | null;
}) {
  const [goals, setGoals] = useState<GoalRow[]>(
    initialGoals.length ? initialGoals : [emptyGoal()]
  );
  const [pending, startTransition] = useTransition();
  const readOnly = locked || (status !== "DRAFT" && status !== "REJECTED");
  const totalWeight = goals.reduce((s, g) => s + (g.weightage || 0), 0);

  function updateGoal(index: number, patch: Partial<GoalRow>) {
    setGoals((prev) =>
      prev.map((g, i) => (i === index ? { ...g, ...patch } : g))
    );
  }

  function addGoal() {
    if (goals.length >= 8) {
      toast.error("Maximum 8 goals allowed.");
      return;
    }
    setGoals((prev) => [...prev, emptyGoal()]);
  }

  function removeGoal(index: number) {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveGoals(sheetId, goals);
        toast.success("Draft saved.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await saveGoals(sheetId, goals);
        await submitGoalSheet(sheetId);
        toast.success("Goal sheet submitted for approval.");
        window.location.reload();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Submit failed.");
      }
    });
  }

  return (
    <div className="space-y-4">
      {rejectionNote ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Manager feedback:</strong> {rejectionNote}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <Badge variant={totalWeight === 100 ? "success" : "warning"}>
          Total weight: {totalWeight}%
        </Badge>
        <Badge variant="default">{status}</Badge>
      </div>

      {goals.map((goal, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Goal {index + 1}</CardTitle>
            {!readOnly && !goal.isShared && goals.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGoal(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
            {goal.isShared ? <Badge variant="info">Shared</Badge> : null}
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Title</Label>
              <Input
                value={goal.title}
                disabled={readOnly || goal.isShared}
                onChange={(e) => updateGoal(index, { title: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={goal.description ?? ""}
                disabled={readOnly}
                onChange={(e) => updateGoal(index, { description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Thrust area</Label>
              <Select
                value={goal.thrustAreaId}
                disabled={readOnly || goal.isShared}
                onValueChange={(v) => updateGoal(index, { thrustAreaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {thrustAreas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>UOM</Label>
              <Select
                value={goal.uomType}
                disabled={readOnly || goal.isShared}
                onValueChange={(v) => updateGoal(index, { uomType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(UOM_LABELS) as UomType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {UOM_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Input
                type="number"
                value={goal.target}
                disabled={readOnly || goal.isShared}
                onChange={(e) =>
                  updateGoal(index, { target: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Weight %</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={goal.weightage}
                disabled={readOnly}
                onChange={(e) =>
                  updateGoal(index, { weightage: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {!readOnly ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addGoal}>
            <Plus className="h-4 w-4" />
            Add goal
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save draft
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            <Send className="h-4 w-4" />
            Submit for approval
          </Button>
        </div>
      ) : null}
    </div>
  );
}
