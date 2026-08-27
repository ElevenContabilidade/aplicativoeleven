"use client";

import { Landmark } from "lucide-react";
import { DepartmentPanel } from "@/components/departments/department-panel";

export default function FiscalPage() {
  return (
    <DepartmentPanel
      title="Fiscal"
      description="Apurações, obrigações acessórias, notas e pendências fiscais da carteira."
      responsavelKey="fiscal"
      departamento="Fiscal"
      icon={Landmark}
    />
  );
}
