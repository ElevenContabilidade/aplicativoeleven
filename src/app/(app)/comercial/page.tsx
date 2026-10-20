"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { LeadFormDialog } from "@/components/crm/lead-form-dialog";
import { CrmPipelineChart, CrmDashboardStats, CrmAquisicao } from "@/components/crm/crm-analytics";
import { CrmGeralTable } from "@/components/crm/crm-geral-table";
import { CrmCompromissosCalendar } from "@/components/crm/crm-compromissos-calendar";
import { CrmFechadosTab, CrmPerdidosTab } from "@/components/crm/crm-fechados-perdidos";
import { CrmMetricasTab } from "@/components/crm/crm-metricas";
import { MetaMensalCard } from "@/components/crm/meta-mensal-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PeriodChip, MESES, MESES_VALUE, periodoLabelFor, usePeriodoLeads } from "@/components/crm/crm-shared";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));

type CrmTab = "dashboard" | "pipeline" | "geral" | "compromissos" | "fechados" | "perdidos" | "aquisicao" | "metricas";

const TABS_COM_PERIODO: CrmTab[] = ["dashboard", "pipeline", "fechados", "perdidos", "aquisicao", "metricas"];

export default function ComercialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "lead");
  const [tab, setTab] = useState<CrmTab>("dashboard");
  const [year, setYear] = useState(() => {
    const atual = new Date().getFullYear().toString();
    return YEARS.includes(atual) ? atual : YEARS[0];
  });
  const [mes, setMes] = useState("anual");

  useEffect(() => {
    if (searchParams.get("novo") === "lead") router.replace("/comercial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { leadsDoAno, leadsFiltrados } = usePeriodoLeads(year, mes);
  const periodoLabel = periodoLabelFor(year, mes);

  return (
    <div>
      <PageHeader
        title="Comercial"
        description="Pipeline visual da jornada Lead → Prospecção → Fechamento."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-3.5" /> Novo lead
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as CrmTab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="compromissos">Compromissos</TabsTrigger>
          <TabsTrigger value="fechados">Fechados</TabsTrigger>
          <TabsTrigger value="perdidos">Perdidos</TabsTrigger>
          <TabsTrigger value="aquisicao">Aquisição</TabsTrigger>
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
        </TabsList>
      </Tabs>

      {TABS_COM_PERIODO.includes(tab) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <PeriodChip label="Ano inteiro" active={mes === "anual"} onClick={() => setMes("anual")} />
            {MESES.map((label, i) => (
              <PeriodChip key={label} label={label} active={mes === MESES_VALUE[i]} onClick={() => setMes(MESES_VALUE[i])} />
            ))}
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      )}

      {tab === "dashboard" && (
        <div className="space-y-4">
          <MetaMensalCard year={year} mes={mes} />
          <CrmDashboardStats leadsFiltrados={leadsFiltrados} periodoLabel={periodoLabel} />
          <CrmPipelineChart leadsFiltrados={leadsFiltrados} periodoLabel={periodoLabel} />
        </div>
      )}

      {tab === "pipeline" && (
        <div className="space-y-4">
          <CrmPipelineChart leadsFiltrados={leadsFiltrados} periodoLabel={periodoLabel} />
          <KanbanBoard />
        </div>
      )}

      {tab === "geral" && <CrmGeralTable />}

      {tab === "compromissos" && <CrmCompromissosCalendar />}

      {tab === "fechados" && <CrmFechadosTab leadsFiltrados={leadsFiltrados} periodoLabel={periodoLabel} />}

      {tab === "perdidos" && <CrmPerdidosTab leadsFiltrados={leadsFiltrados} periodoLabel={periodoLabel} />}

      {tab === "aquisicao" && <CrmAquisicao leadsFiltrados={leadsFiltrados} leadsDoAno={leadsDoAno} />}

      {tab === "metricas" && <CrmMetricasTab leadsFiltrados={leadsFiltrados} periodoLabel={periodoLabel} />}

      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
