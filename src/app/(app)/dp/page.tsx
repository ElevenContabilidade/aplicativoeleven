"use client";

import { PageHeader } from "@/components/layout/page-header";
import { PessoalChecklist } from "@/components/departments/pessoal-checklist";

export default function DPPage() {
  return (
    <div>
      <PageHeader
        title="Departamento Pessoal"
        description="Admissões, desligamentos, férias, folha, pró-labore, eSocial e FGTS."
      />
      <PessoalChecklist />
    </div>
  );
}
