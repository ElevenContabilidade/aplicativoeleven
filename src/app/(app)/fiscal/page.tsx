"use client";

import { PageHeader } from "@/components/layout/page-header";
import { FiscalChecklist } from "@/components/departments/fiscal-checklist";

export default function FiscalPage() {
  return (
    <div>
      <PageHeader
        title="Fiscal"
        description="Apurações, obrigações acessórias, notas e pendências fiscais da carteira."
      />
      <FiscalChecklist />
    </div>
  );
}
