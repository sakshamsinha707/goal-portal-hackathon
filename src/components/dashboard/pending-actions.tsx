import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PendingActions({
  items,
}: {
  items: { label: string; href: string; priority: "high" | "normal" }[];
}) {
  if (!items.length) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-sm">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <div>
          <p className="font-medium text-slate-800">No pending actions</p>
          <p className="text-slate-500">You&apos;re caught up for this cycle.</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-slate-50",
              item.priority === "high"
                ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50"
                : "border-slate-200 bg-white"
            )}
          >
            {item.priority === "high" ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            )}
            <span className="flex-1 font-medium text-slate-800">{item.label}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[11px] font-medium",
                item.priority === "high"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-500"
              )}
            >
              {item.priority === "high" ? "Due" : "Info"}
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
