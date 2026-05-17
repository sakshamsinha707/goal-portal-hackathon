import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PendingActions({
  items,
}: {
  items: { label: string; href: string; priority: "high" | "normal" }[];
}) {
  if (!items.length) {
    return (
      <p className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 px-3 py-4 text-sm text-slate-500">
        No pending actions. You&apos;re caught up for this cycle.
      </p>
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
                ? "border-amber-200 bg-amber-50/50"
                : "border-slate-200 bg-white"
            )}
          >
            {item.priority === "high" ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            )}
            <span className="flex-1 font-medium text-slate-800">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
