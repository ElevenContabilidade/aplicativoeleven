"use client";

import Link from "next/link";
import { AlertTriangle, ShieldAlert, TrendingUp, Wallet, ListChecks, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatDateTime } from "@/lib/utils";
import type { NotificationTipo } from "@/lib/types";

const ICONS: Record<NotificationTipo, typeof AlertTriangle> = {
  urgente: AlertTriangle,
  certificado: ShieldAlert,
  comercial: TrendingUp,
  financeiro: Wallet,
  tarefa: ListChecks,
};

const LABELS: Record<NotificationTipo, string> = {
  urgente: "Urgente",
  certificado: "Certificado",
  comercial: "Comercial",
  financeiro: "Financeiro",
  tarefa: "Tarefa",
};

const TONES: Record<NotificationTipo, string> = {
  urgente: "text-status-danger bg-status-danger-bg",
  certificado: "text-status-warning bg-status-warning-bg",
  comercial: "text-status-info bg-status-info-bg",
  financeiro: "text-wine-700 bg-wine-100",
  tarefa: "text-status-neutral bg-status-neutral-bg",
};

export default function AlertasPage() {
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAllRead = useAppStore((s) => s.markAllNotificationsRead);
  const sorted = [...notifications].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div>
      <PageHeader
        title="Central de alertas"
        description="Obrigações vencendo, certificados expirando, leads sem contato e honorários em atraso."
        actions={<Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="size-3.5" /> Marcar tudo como lido</Button>}
      />

      <div className="space-y-2">
        {sorted.map((n) => {
          const Icon = ICONS[n.tipo];
          return (
            <Link key={n.id} href={n.href ?? "#"} onClick={() => markRead(n.id)}>
              <Card className={cn(!n.lida && "border-wine-200 bg-wine-50/40")}>
                <CardContent className="flex items-start gap-3 p-4">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", TONES[n.tipo])}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-sand-900">{n.titulo}</p>
                      <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-medium text-sand-500">{LABELS[n.tipo]}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-sand-500">{n.descricao}</p>
                    <p className="mt-1 text-[11px] text-sand-400">{formatDateTime(n.data)}</p>
                  </div>
                  {!n.lida && <span className="mt-1 size-2 shrink-0 rounded-full bg-wine-600" />}
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {sorted.length === 0 && <p className="py-16 text-center text-sand-400">Nenhum alerta no momento.</p>}
      </div>
    </div>
  );
}
