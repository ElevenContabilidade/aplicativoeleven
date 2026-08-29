"use client";

import { Calculator } from "lucide-react";
import { DepartmentPanel } from "@/components/departments/department-panel";
import { ContabilChecklist } from "@/components/departments/contabil-checklist";

export default function ContabilPage() {
  return (
    <>
      <DepartmentPanel
        title="Contábil"
        description="Conciliações, fechamentos, balancetes e demonstrações da carteira."
        responsavelKey="contabil"
        departamento="Contábil"
        docCategorias={["Contábil", "Relatórios"]}
        icon={Calculator}
        showOverview={false}
      />
      <ContabilChecklist />
    </>
  );
}
