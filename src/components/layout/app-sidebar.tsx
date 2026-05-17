"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  Users,
  FileBarChart,
  Shield,
  Bell,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const employeeNav: NavItem[] = [
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
  { href: "/goals", label: "My goals", icon: Target },
  { href: "/check-ins", label: "Quarterly check-ins", icon: ClipboardCheck },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const managerNav: NavItem[] = [
  { href: "/manager", label: "Dashboard", icon: LayoutDashboard },
  { href: "/manager/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/manager/team", label: "Team", icon: Users },
  { href: "/manager/check-ins", label: "Check-ins", icon: Target },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/shared-goals", label: "Shared goals", icon: Share2 },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/audit", label: "Audit log", icon: Shield },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

function navForRole(role: Role): NavItem[] {
  if (role === "ADMIN") return [...employeeNav.slice(0, 2), ...adminNav];
  if (role === "MANAGER") return managerNav;
  return employeeNav;
}

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          AtomQuest
        </p>
        <h1 className="text-sm font-semibold text-slate-900">Goal Portal</h1>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                active
                  ? "bg-white font-medium text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-white/60"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
