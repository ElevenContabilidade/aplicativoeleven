"use client";

import { PageHeader } from "@/components/layout/page-header";
import { MeiChecklist } from "@/components/departments/mei-checklist";

export default function MeiPage() {
  return (
    <div>
      <PageHeader
        title="MEI"
        description="Checklist mensal exclusivo dos clientes MEI: DAS, extratos, notas, planilha e relatório."
      />
      <MeiChecklist />
    </div>
  );
}
