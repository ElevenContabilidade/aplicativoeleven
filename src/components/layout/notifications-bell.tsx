"use client";

import Link from "next/link";
import { Bell, AlertTriangle, ShieldAlert, TrendingUp, Wallet, ListChecks } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatDate } from "@/lib/utils";
import type { NotificationTipo } from "@/lib/types";

const ICONS: Record<NotificationTipo, typeof Bell> = {
  urgente: AlertTriangle,
  certificado: ShieldAlert,
  comercial: TrendingUp,
  financeiro: Wallet,
  tarefa: ListChecks,
};

const TONES: Record<NotificationTipo, string> = {
  urgente: "text-status-danger bg-status-danger-bg",
  certificado: "text-status-warning bg-status-warning-bg",
  comercial: "text-status-info bg-status-info-bg",
  financeiro: "text-wine-700 bg-wine-100",
  tarefa: "text-status-neutral bg-status-neutral-bg",
};

export function NotificationsBell() {
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead);
  const unread = notifications.filter((n) => !n.lida).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex size-9 items-center justify-center rounded-lg text-sand-500 hover:bg-sand-100 hover:text-sand-800">
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-status-danger text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0">Central de alertas</DropdownMenuLabel>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[11px] font-medium text-wine-700 hover:underline">
              Marcar tudo como lido
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {notifications.map((n) => {
            const Icon = ICONS[n.tipo];
            return (
              <Link
                key={n.id}
                href={n.href ?? "#"}
                onClick={() => markRead(n.id)}
                className={cn("flex gap-2.5 border-b border-sand-100 px-3 py-2.5 last:border-0 hover:bg-sand-50", !n.lida && "bg-wine-50/40")}
              >
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", TONES[n.tipo])}>
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-sand-900">{n.titulo}</span>
                  <span className="block truncate text-[11px] text-sand-500">{n.descricao}</span>
                  <span className="mt-0.5 block text-[10px] text-sand-400">{formatDate(n.data)}</span>
                </span>
                {!n.lida && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-wine-600" />}
              </Link>
            );
          })}
          {notifications.length === 0 && <p className="px-3 py-8 text-center text-xs text-sand-400">Sem notificações.</p>}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <Link href="/alertas" className="block px-3 py-2.5 text-center text-xs font-medium text-wine-700 hover:bg-sand-50">
          Ver central de alertas
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
