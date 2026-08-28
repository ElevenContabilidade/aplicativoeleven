"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scale, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProcessoFormDialog } from "@/components/societario/processo-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import { formatDate } from "@/lib/utils";

export default function SocietarioPage() {
  const clients = useAppStore((s) => s.clients);
  const processos = useAppStore((s) => s.processosSocietarios);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/societario");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myClients = clients.filter((c) => c.responsaveis.societario);
  const emAndamento = processos.filter((p) => p.status !== "Finalizado").length;
  const emExigencia = processos.filter((p) => p.status === "Exigência").length;

  return (
    <div>
      <PageHeader
        title="Societário"
        description="Abertura, alteração, baixa, inscrições e regularizações em andamento."
        actions={<Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Novo processo</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Clientes do setor" value={myClients.length} icon={Scale} tone="wine" />
        <MetricCard label="Processos em andamento" value={emAndamento} />
        <MetricCard label="Em exigência" value={emExigencia} tone="warning" />
      </div>

      <Card>
        <CardHeader><CardTitle>Processos societários</CardTitle></CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Órgão</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processos.map((p) => {
                const client = clients.find((c) => c.id === p.clienteId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{client?.dados.nomeFantasia ?? client?.dados.razaoSocial}</TableCell>
                    <TableCell>{p.tipoServico}</TableCell>
                    <TableCell>{p.orgao}</TableCell>
                    <TableCell className="text-sand-500">{p.protocolo ?? "—"}</TableCell>
                    <TableCell>{teamName(p.responsavelId)}</TableCell>
                    <TableCell>{formatDate(p.prazo)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                );
              })}
              {processos.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhum processo em andamento.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProcessoFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
