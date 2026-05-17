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
        <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">
              {a.goalSheet.employee.name}
            </p>
            {a.managerNotes ? (
              <p className="truncate text-xs text-slate-500">{a.managerNotes}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={a.status === "APPROVED" ? "success" : "danger"}>
              {a.status === "APPROVED" ? "Approved" : "Returned"}
            </Badge>
            {a.reviewedAt ? (
              <span className="text-xs text-slate-400">
                {formatRelativeTime(a.reviewedAt)}
              </span>
            ) : null}
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
