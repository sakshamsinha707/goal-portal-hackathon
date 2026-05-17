import { getEmployeeCheckIns } from "@/actions/checkins";
import { AppHeader } from "@/components/layout/app-header";
import { CheckInForm } from "@/components/check-in-form";
import { EmptyState } from "@/components/empty-state";
import { ClipboardCheck } from "lucide-react";
import { QUARTER_LABELS } from "@/lib/constants";

export default async function CheckInsPage() {
  const { sheet, quarter } = await getEmployeeCheckIns();

  return (
    <>
      <AppHeader
        title="Quarterly check-ins"
        subtitle={sheet ? sheet.cycle.label : "Complete goal approval first"}
      />
      <main className="flex-1 p-6">
        {!sheet || !sheet.goals.length ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No approved goals"
            description="Once your manager approves your goal sheet, check-ins unlock here."
            actionLabel="Go to goals"
            actionHref="/goals"
          />
        ) : (
          <CheckInForm goals={sheet.goals} quarter={quarter} />
        )}
        <p className="mt-4 text-xs text-slate-500">
          Current quarter: {QUARTER_LABELS[quarter]}
        </p>
      </main>
    </>
  );
}
