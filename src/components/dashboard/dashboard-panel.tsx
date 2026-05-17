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
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
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
          <CardTitle className={compact ? "text-sm" : undefined}>{title}</CardTitle>
          {subtitle ? (
            <p className="text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className="shrink-0 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            {actionLabel}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className={compact ? "pt-0" : undefined}>{children}</CardContent>
    </Card>
  );
}
