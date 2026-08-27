"use client";

import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import { formatDate } from "@/lib/utils";

export default function OnboardingPage() {
  const clients = useAppStore((s) => s.clients);
  const onboardingClients = clients.filter((c) => c.status === "Onboarding" || c.status === "Implantação");

  return (
    <div>
      <PageHeader
        title="Onboarding"
        description="Clientes fechados recentemente em processo de implantação na Eleven."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {onboardingClients.map((c) => {
          const done = c.onboarding.filter((i) => i.concluido).length;
          const pct = Math.round((done / c.onboarding.length) * 100);
          const nextItem = c.onboarding.find((i) => !i.concluido);
          return (
            <Link key={c.id} href={`/clientes/${c.id}?tab=onboarding`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-sand-900">{c.dados.nomeFantasia ?? c.dados.razaoSocial}</p>
                      <p className="truncate text-[11px] text-sand-400">{c.dados.cnpj}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Progress value={pct} className="flex-1" />
                    <span className="text-xs font-semibold text-wine-700">{pct}%</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-sand-500">
                    <ClipboardCheck className="size-3.5 text-wine-500" />
                    {nextItem ? <span>Próximo: {nextItem.label}</span> : <span>Checklist concluído</span>}
                  </div>
                  <p className="mt-2 text-[11px] text-sand-400">
                    Responsável: {c.responsaveis.relacionamento ? teamName(c.responsaveis.relacionamento) : "—"} • desde {formatDate(c.criadoEm)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {onboardingClients.length === 0 && (
          <p className="col-span-full py-16 text-center text-sand-400">Nenhum cliente em onboarding no momento.</p>
        )}
      </div>
    </div>
  );
}
