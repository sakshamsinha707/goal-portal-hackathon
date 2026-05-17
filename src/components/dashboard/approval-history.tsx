import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format-time";
import { EmptyState } from "@/components/empty-state";
import { ClipboardCheck } from "lucide-react";

type ApprovalRow = {
  id: string;
  status: string;
  reviewedAt: Date | null;
  managerNotes: string | null;
  goalSheet: {
    id: string;
    employee: { name: string };
  };
};

export function ApprovalHistoryList({
  items,
  reviewHref,
}: {
  items: ApprovalRow[];
  reviewHref?: (sheetId: string) => string;
}) {
  if (!items.length) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No approval history yet"
        description="Completed reviews will show here with timestamps."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((a) => (
        <li key={a.id} className="flex items-start justify-between gap-3 py-2.5">
          <div className="min-w-0 border-l-2 border-slate-200 pl-3">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-900">
                {a.goalSheet.employee.name}
              </p>
              <Badge variant={a.status === "APPROVED" ? "success" : "danger"}>
                {a.status === "APPROVED" ? "Approved" : "Returned"}
              </Badge>
            </div>
            {a.managerNotes ? (
              <p className="truncate text-xs text-slate-500">{a.managerNotes}</p>
            ) : null}
            {a.reviewedAt ? (
              <p className="text-xs text-slate-400">
                Reviewed {formatRelativeTime(a.reviewedAt)}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {reviewHref ? (
              <Link
                href={reviewHref(a.goalSheet.id)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                View
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
