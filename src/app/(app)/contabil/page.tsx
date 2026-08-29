"use client";

import { PageHeader } from "@/components/layout/page-header";
import { ContabilChecklist } from "@/components/departments/contabil-checklist";

export default function ContabilPage() {
  return (
    <div>
      <PageHeader
        title="Contábil"
        description="Conciliações, fechamentos, balancetes e demonstrações da carteira."
      />
      <ContabilChecklist />
    </div>
  );
}
