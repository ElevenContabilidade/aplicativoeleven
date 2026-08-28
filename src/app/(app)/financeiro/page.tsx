"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, CircleDollarSign, CircleAlert, Repeat, Receipt, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { RecebimentoFormDialog } from "@/components/financial/recebimento-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FinanceiroPage() {
  const clients = useAppStore((s) => s.clients);
  const servicosExtras = useAppStore((s) => s.servicosExtras);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/financeiro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ativos = clients.filter((c) => c.status === "Ativo");
  const mrr = ativos.reduce((a, c) => a + c.financeiro.valorMensal, 0);
  const ticketMedio = ativos.length ? mrr / ativos.length : 0;

  const ledger = clients
    .flatMap((c) => c.historicoFinanceiro.map((h) => ({ ...h, cliente: c })))
    .sort((a, b) => b.vencimento.localeCompare(a.vencimento))
    .slice(0, 30);

  const recebido = clients.flatMap((c) => c.historicoFinanceiro).filter((h) => h.status === "Pago").reduce((a, h) => a + h.valor, 0);
  const emAberto = clients.flatMap((c) => c.historicoFinanceiro).filter((h) => h.status === "Em aberto").reduce((a, h) => a + h.valor, 0);
  const inadimplencia = clients.flatMap((c) => c.historicoFinanceiro).filter((h) => h.status === "Atrasado").reduce((a, h) => a + h.valor, 0);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Honorários, recebimentos, inadimplência e serviços extras da carteira."
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Novo recebimento</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="MRR" value={formatCurrency(mrr)} icon={Repeat} tone="wine" />
        <MetricCard label="Recebido" value={formatCurrency(recebido)} icon={CircleDollarSign} tone="success" />
        <MetricCard label="Em aberto" value={formatCurrency(emAberto)} icon={Wallet} tone="warning" />
        <MetricCard label="Inadimplência" value={formatCurrency(inadimplencia)} icon={CircleAlert} tone="danger" />
        <MetricCard label="Ticket médio" value={formatCurrency(ticketMedio)} icon={Receipt} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Honorários — histórico recente</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Cliente</TableHead><TableHead>Competência</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((h) => (
                  <TableRow key={h.id + h.cliente.id}>
                    <TableCell className="font-medium">{h.cliente.dados.nomeFantasia ?? h.cliente.dados.razaoSocial}</TableCell>
                    <TableCell>{h.competencia}</TableCell>
                    <TableCell>{formatCurrency(h.valor)}</TableCell>
                    <TableCell>{formatDate(h.vencimento)}</TableCell>
                    <TableCell><StatusBadge status={h.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Serviços extras</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-4">
            {servicosExtras.map((s) => {
              const client = clients.find((c) => c.id === s.clienteId);
              return (
                <div key={s.id} className="rounded-lg border border-sand-200 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sand-900">{s.servico}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="mt-1 text-sand-500">{client?.dados.nomeFantasia} • {formatCurrency(s.valor)}</p>
                  <p className="text-[11px] text-sand-400">{teamName(s.responsavelId)} • {formatDate(s.data)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <RecebimentoFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
