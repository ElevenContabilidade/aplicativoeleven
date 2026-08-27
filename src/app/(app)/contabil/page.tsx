"use client";

import { Calculator } from "lucide-react";
import { DepartmentPanel } from "@/components/departments/department-panel";

export default function ContabilPage() {
  return (
    <DepartmentPanel
      title="Contábil"
      description="Conciliações, fechamentos, balancetes e demonstrações da carteira."
      responsavelKey="contabil"
      departamento="Contábil"
      docCategorias={["Contábil", "Relatórios"]}
      icon={Calculator}
    />
  );
}
