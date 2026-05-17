"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  listSharedGoalTemplates,
  listDepartmentsAndThrustAreas,
  pushSharedGoalToDepartment,
} from "@/actions/shared-goals";
import { AppHeader } from "@/components/layout/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UOM_LABELS } from "@/lib/constants";
import type { UomType } from "@prisma/client";
import { formatDate } from "@/lib/utils";

export default function SharedGoalsPage() {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [thrustAreas, setThrustAreas] = useState<{ id: string; name: string }[]>([]);
  const [templates, setTemplates] = useState<
    Awaited<ReturnType<typeof listSharedGoalTemplates>>
  >([]);
  const [pending, startTransition] = useTransition();

  const [departmentId, setDepartmentId] = useState("");
  const [thrustAreaId, setThrustAreaId] = useState("");
  const [title, setTitle] = useState("");
  const [uomType, setUomType] = useState<UomType>("PERCENT_MIN");
  const [target, setTarget] = useState(70);
  const [weight, setWeight] = useState(15);

  useEffect(() => {
    listDepartmentsAndThrustAreas().then(({ departments: d, thrustAreas: t }) => {
      setDepartments(d);
      setThrustAreas(t);
      if (d[0]) setDepartmentId(d[0].id);
      if (t[0]) setThrustAreaId(t[0].id);
    });
    listSharedGoalTemplates().then(setTemplates);
  }, []);

  function handlePush(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await pushSharedGoalToDepartment({
          departmentId,
          thrustAreaId,
          title,
          uomType,
          target,
          defaultWeightage: weight,
        });
        toast.success(`Pushed to ${res.pushed} employees.`);
        setTemplates(await listSharedGoalTemplates());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Push failed.");
      }
    });
  }

  return (
    <>
      <AppHeader title="Shared goals" subtitle="Push department goals to draft sheets" />
      <main className="flex-1 grid gap-6 p-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Push new shared goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePush} className="space-y-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Thrust area</Label>
                <Select value={thrustAreaId} onValueChange={setThrustAreaId}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>UOM</Label>
                <Select value={uomType} onValueChange={(v) => setUomType(v as UomType)}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default weight %</Label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>
              <Button type="submit" disabled={pending}>
                Push to department
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Templates ({templates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {templates.map((t) => (
                <li key={t.id} className="rounded-md border border-slate-100 p-3">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-slate-500">
                    {t.department.name} · {t.thrustArea.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    By {t.createdBy.name} · {formatDate(t.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
