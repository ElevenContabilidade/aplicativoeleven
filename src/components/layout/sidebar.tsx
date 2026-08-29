"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { NAV_ITEMS } from "./nav-config";
import { EleveLogo, EleveMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const SECTION_LABEL: Record<string, string> = {
  principal: "Principal",
  operacao: "Operação",
  gestao: "Gestão",
};

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = ["principal", "operacao", "gestao"] as const;

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-1 scrollbar-thin">
      {sections.map((section) => (
        <div key={section}>
          {!collapsed && (
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream-200/40">
              {SECTION_LABEL[section]}
            </p>
          )}
          <ul className="space-y-0.5">
            {NAV_ITEMS.filter((i) => i.section === section).map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-cream-100/95 text-wine-800"
                        : "text-cream-100/75 hover:bg-white/8 hover:text-cream-50"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-wine-950 transition-[width] duration-200 md:flex",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="flex min-h-16 shrink-0 items-center justify-between px-4 py-3">
        {collapsed ? (
          <EleveMark className="size-7 text-cream-100" />
        ) : (
          <EleveLogo variant="cream" markClassName="h-7 w-7" showTagline />
        )}
      </div>

      <SidebarNav collapsed={collapsed} />

      <div className="border-t border-white/10 p-2.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-cream-100/60 hover:bg-white/8 hover:text-cream-50"
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && <span>Recolher menu</span>}
        </button>
      </div>
    </aside>
  );
}
