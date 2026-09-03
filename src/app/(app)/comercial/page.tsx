"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { LeadFormDialog } from "@/components/crm/lead-form-dialog";
import { CrmAnalytics } from "@/components/crm/crm-analytics";
import { MetaMensalCard } from "@/components/crm/meta-mensal-card";
import { Button } from "@/components/ui/button";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));

export default function ComercialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "lead");
  const [year, setYear] = useState(() => {
    const atual = new Date().getFullYear().toString();
    return YEARS.includes(atual) ? atual : YEARS[0];
  });
  const [mes, setMes] = useState("anual");

  useEffect(() => {
    if (searchParams.get("novo") === "lead") router.replace("/comercial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="Comercial"
        description="Pipeline visual da jornada Lead → Prospecção → Fechamento. Arraste os cards entre as etapas."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-3.5" /> Novo lead
          </Button>
        }
      />
      <MetaMensalCard year={year} mes={mes} />
      <CrmAnalytics years={YEARS} year={year} mes={mes} onYearChange={setYear} onMesChange={setMes} />
      <KanbanBoard />
      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
