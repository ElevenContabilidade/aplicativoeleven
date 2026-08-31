"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, CircleDollarSign, CircleAlert, Repeat, Receipt, Plus, Scale, Trash2, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { RecebimentoFormDialog } from "@/components/financial/recebimento-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import { resumoFinanceiroSocietario } from "@/lib/societario-financeiro";
import { formatCurrency, formatDate } from "@/lib/utils";

const TODOS = "todos";

export default function FinanceiroPage() {
  const clients = useAppStore((s) => s.clients);
  const servicosExtras = useAppStore((s) => s.servicosExtras);
  const processosSocietarios = useAppStore((s) => s.processosSocietarios);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const updateRecebimento = useAppStore((s) => s.updateRecebimento);
  const deleteRecebimento = useAppStore((s) => s.deleteRecebimento);
  const resumoSocietario = resumoFinanceiroSocietario(processosSocietarios);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");
  const [filtroBanco, setFiltroBanco] = useState(TODOS);
  const [filtroTipo, setFiltroTipo] = useState(TODOS);

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/financeiro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ativos = clients.filter((c) => c.status === "Ativo");
  const mrr = ativos.reduce((a, c) => a + c.financeiro.valorMensal, 0);
  const ticketMedio = ativos.length ? mrr / ativos.length : 0;

  const ledgerAll = useMemo(() => {
    const doClientes = clients.flatMap((c) =>
      c.historicoFinanceiro.map((h) => ({
        ...h,
        key: `cliente-${c.id}-${h.id}`,
        nome: c.dados.nomeFantasia ?? c.dados.razaoSocial,
        banco: undefined as string | undefined,
        tipoPessoa: undefined as "PF" | "PJ" | undefined,
        avulso: false as const,
      }))
    );
    const avulsos = recebimentos.map((r) => ({ ...r, key: `avulso-${r.id}`, avulso: true as const }));
    return [...doClientes, ...avulsos];
  }, [clients, recebimentos]);

  const bancosDisponiveis = useMemo(
    () => [...new Set(recebimentos.map((r) => r.banco).filter((b): b is string => !!b))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [recebimentos]
  );

  const ledgerFiltrado = ledgerAll.filter(
    (h) => (filtroBanco === TODOS || h.banco === filtroBanco) && (filtroTipo === TODOS || h.tipoPessoa === filtroTipo)
  );

  const ledger = [...ledgerFiltrado].sort((a, b) => b.vencimento.localeCompare(a.vencimento)).slice(0, 30);

  const recebido = ledgerFiltrado.filter((h) => h.status === "Pago").reduce((a, h) => a + h.valor, 0);
  const emAberto = ledgerFiltrado.filter((h) => h.status === "Em aberto").reduce((a, h) => a + h.valor, 0);
  const inadimplencia = ledgerFiltrado.filter((h) => h.status === "Atrasado").reduce((a, h) => a + h.valor, 0);

  function handleDeleteRecebimento(id: string, nome: string) {
    if (confirm(`Excluir o recebimento de "${nome}"?`)) deleteRecebimento(id);
  }

  function marcarComoRecebido(id: string) {
    updateRecebimento(id, { status: "Pago", pagamento: new Date().toISOString().slice(0, 10) });
  }

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
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Honorários — histórico recente</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={filtroBanco} onValueChange={setFiltroBanco}>
                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Banco" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos os bancos</SelectItem>
                  {bancosDisponiveis.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>PF e PJ</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="PF">PF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((h) => (
                  <TableRow key={h.key}>
                    <TableCell className="font-medium">{h.nome}</TableCell>
                    <TableCell>{h.competencia}</TableCell>
                    <TableCell className="text-sand-500">{h.servico ?? "—"}</TableCell>
                    <TableCell className="text-sand-500">{h.banco ?? "—"}</TableCell>
                    <TableCell className="text-sand-500">{h.tipoPessoa ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(h.valor)}</TableCell>
                    <TableCell>{formatDate(h.vencimento)}</TableCell>
                    <TableCell><StatusBadge status={h.status} /></TableCell>
                    <TableCell>
                      {h.avulso && (
                        <div className="flex items-center gap-1">
                          {h.status !== "Pago" && (
                            <button
                              type="button"
                              onClick={() => marcarComoRecebido(h.id)}
                              title="Marcar como recebido"
                              className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-success-bg hover:text-status-success"
                            >
                              <Check className="size-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteRecebimento(h.id, h.nome)}
                            title="Excluir recebimento"
                            className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {ledger.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-sand-400">Nenhum recebimento encontrado.</TableCell></TableRow>
                )}
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

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Scale className="size-4 text-wine-600" /> Societário — quanto ganho por serviço</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MetricCard label="Total cobrado" value={formatCurrency(resumoSocietario.total)} icon={Wallet} tone="wine" />
            <MetricCard label="Recebido" value={formatCurrency(resumoSocietario.recebido)} icon={CircleDollarSign} tone="success" />
            <MetricCard label="A receber" value={formatCurrency(resumoSocietario.aReceber)} icon={Wallet} tone="warning" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Processos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Recebido</TableHead>
                <TableHead>A receber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumoSocietario.porServico.map((s) => (
                <TableRow key={s.tipoServico}>
                  <TableCell className="font-medium">{s.tipoServico}</TableCell>
                  <TableCell>{s.qtd}</TableCell>
                  <TableCell>{formatCurrency(s.total)}</TableCell>
                  <TableCell className="text-status-success">{formatCurrency(s.recebido)}</TableCell>
                  <TableCell className="text-status-warning">{formatCurrency(s.aReceber)}</TableCell>
                </TableRow>
              ))}
              {resumoSocietario.porServico.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sand-400">Nenhum processo societário com valor informado ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RecebimentoFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
