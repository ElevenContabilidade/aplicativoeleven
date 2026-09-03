"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import { NAV_ITEMS, NAV_GROUP_ICON } from "./nav-config";
import { EleveLogo, EleveMark } from "@/components/brand/logo";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { moduloDaRota, temPermissao } from "@/lib/permissoes";
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
  const permissoes = useAppStore((s) => s.permissoes);
  const team = useAppStore((s) => s.team);
  const userId = useAuthStore((s) => s.userId);
  const sections = ["principal", "operacao", "gestao"] as const;
  const [gruposFechados, setGruposFechados] = useState<Record<string, boolean>>({});
  const colaborador = team.find((m) => m.id === userId);

  function podeVer(href: string) {
    const modulo = moduloDaRota(href);
    // Equipe gerencia as permissões de todo mundo — fica visível só pra
    // Administrador, independente da matriz de permissões granular.
    if (modulo === "Equipe") return colaborador?.perfil === "Administrador";
    return !modulo || !userId || temPermissao(permissoes, userId, modulo, "Visualizar");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function renderItem(item: (typeof NAV_ITEMS)[number], indent: boolean) {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
            indent && !collapsed && "pl-4",
            active ? "bg-cream-100/95 text-wine-800" : "text-cream-100/75 hover:bg-white/8 hover:text-cream-50"
          )}
        >
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  }

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-1 scrollbar-thin">
      {sections.map((section) => {
        const itens = NAV_ITEMS.filter((i) => i.section === section && podeVer(i.href));
        const gruposRenderizados = new Set<string>();

        return (
          <div key={section}>
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream-200/40">
                {SECTION_LABEL[section]}
              </p>
            )}
            <ul className="space-y-0.5">
              {itens.flatMap((item) => {
                if (!item.group) return [renderItem(item, false)];
                if (gruposRenderizados.has(item.group)) return [];
                gruposRenderizados.add(item.group);

                const filhos = itens.filter((i) => i.group === item.group);
                const grupoAtivo = filhos.some((f) => isActive(f.href));
                const fechado = gruposFechados[item.group] ?? false;
                const GroupIcon = NAV_GROUP_ICON[item.group] ?? item.icon;

                if (collapsed) return filhos.map((f) => renderItem(f, false));

                return [
                  <li key={item.group}>
                    <button
                      type="button"
                      onClick={() => setGruposFechados((prev) => ({ ...prev, [item.group!]: !fechado }))}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                        grupoAtivo ? "text-cream-50" : "text-cream-100/75 hover:bg-white/8 hover:text-cream-50"
                      )}
                    >
                      <GroupIcon className="size-4 shrink-0" />
                      <span className="flex-1 truncate text-left">{item.group}</span>
                      <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", !fechado && "rotate-180")} />
                    </button>
                    {!fechado && <ul className="mt-0.5 space-y-0.5">{filhos.map((f) => renderItem(f, true))}</ul>}
                  </li>,
                ];
              })}
            </ul>
          </div>
        );
      })}
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
