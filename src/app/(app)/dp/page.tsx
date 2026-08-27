"use client";

import { UserCog } from "lucide-react";
import { DepartmentPanel } from "@/components/departments/department-panel";

export default function DPPage() {
  return (
    <DepartmentPanel
      title="Departamento Pessoal"
      description="Admissões, desligamentos, férias, folha, pró-labore, eSocial e FGTS."
      responsavelKey="pessoal"
      departamento="Pessoal"
      docCategorias={["Folha"]}
      icon={UserCog}
    />
  );
}
