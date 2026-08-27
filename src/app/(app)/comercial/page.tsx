"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { LeadFormDialog } from "@/components/crm/lead-form-dialog";
import { Button } from "@/components/ui/button";

export default function ComercialPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "lead");

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
      <KanbanBoard />
      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
