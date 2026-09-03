"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PessoalChecklist } from "@/components/departments/pessoal-checklist";
import { FeriasControl } from "@/components/departments/ferias-control";
import { Decimo13Control } from "@/components/departments/decimo13-control";
import { RescisaoControl } from "@/components/departments/rescisao-control";

export default function DPPage() {
  return (
    <div>
      <PageHeader
        title="Departamento Pessoal"
        description="Admissões, desligamentos, férias, folha, pró-labore, eSocial e FGTS."
      />
      <Tabs defaultValue="rotinas">
        <TabsList className="mb-4">
          <TabsTrigger value="rotinas">Rotinas</TabsTrigger>
          <TabsTrigger value="ferias">Férias</TabsTrigger>
          <TabsTrigger value="decimo13">13º Salário</TabsTrigger>
          <TabsTrigger value="rescisao">Rescisão</TabsTrigger>
        </TabsList>

        <TabsContent value="rotinas"><PessoalChecklist /></TabsContent>
        <TabsContent value="ferias"><FeriasControl /></TabsContent>
        <TabsContent value="decimo13"><Decimo13Control /></TabsContent>
        <TabsContent value="rescisao"><RescisaoControl /></TabsContent>
      </Tabs>
    </div>
  );
}
