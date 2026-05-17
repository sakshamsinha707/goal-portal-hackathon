import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardPanel({
  title,
  subtitle,
  actionLabel,
  actionHref,
  children,
  className,
  compact,
  meta,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  meta?: string | number;
}) {
  return (
    <Card
      className={cn(
        "transition-all hover:border-slate-300 hover:shadow-md",
        className
      )}
    >
      <CardHeader
        className={cn(
          "flex flex-row items-start justify-between space-y-0",
          compact ? "pb-2" : ""
        )}
      >
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className={compact ? "text-sm" : undefined}>{title}</CardTitle>
            {meta !== undefined ? (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                {meta}
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="shrink-0 rounded px-1.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            {actionLabel}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className={compact ? "pt-0" : undefined}>{children}</CardContent>
    </Card>
  );
}
