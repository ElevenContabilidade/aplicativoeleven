"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, CircleDollarSign, CircleAlert, Repeat, Receipt, Plus, Scale, Trash2, Check, TrendingDown, RotateCcw, Landmark } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { RecebimentoFormDialog } from "@/components/financial/recebimento-form-dialog";
import { DespesaFormDialog } from "@/components/financial/despesa-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { resumoFinanceiroSocietario } from "@/lib/societario-financeiro";
import { resolveBoletoLedger } from "@/lib/boleto";
import { contasAPagarDoPeriodo } from "@/lib/contas-pagar";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const TODOS = "todos";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

export default function FinanceiroPage() {
  const clients = useAppStore((s) => s.clients);
  const servicosExtras = useAppStore((s) => s.servicosExtras);
  const processosSocietarios = useAppStore((s) => s.processosSocietarios);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const boletosMensais = useAppStore((s) => s.boletosMensais);
  const recebimentosParceiro = useAppStore((s) => s.recebimentosParceiro);
  const updateRecebimento = useAppStore((s) => s.updateRecebimento);
  const deleteRecebimento = useAppStore((s) => s.deleteRecebimento);
  const sistemasEscritorio = useAppStore((s) => s.sistemasEscritorio);
  const pagamentosSistemas = useAppStore((s) => s.pagamentosSistemas);
  const despesasAvulsas = useAppStore((s) => s.despesasAvulsas);
  const updatePagamentoSistema = useAppStore((s) => s.updatePagamentoSistema);
  const updateDespesaAvulsa = useAppStore((s) => s.updateDespesaAvulsa);
  const deleteDespesaAvulsa = useAppStore((s) => s.deleteDespesaAvulsa);
  const resumoSocietario = resumoFinanceiroSocietario(processosSocietarios);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");
  const [despesaFormOpen, setDespesaFormOpen] = useState(false);
  const [filtroBanco, setFiltroBanco] = useState(TODOS);
  const [filtroTipo, setFiltroTipo] = useState(TODOS);
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/financeiro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** MRR = soma das assessorias mensais de todo cliente com mensalidade
   * cadastrada (valorMensal > 0) — tanto os que aparecem em Boletos quanto
   * os clientes de parceiro (pagam via PIX, controlados em Parceiros) — um
   * cliente cadastrado com assessoria mensal já entra automaticamente no
   * MRR, mesmo antes de virar "Ativo". */
  const clientesAssessoriaMensal = clients.filter((c) => c.financeiro.valorMensal > 0);
  const mrr = clientesAssessoriaMensal.reduce((a, c) => a + c.financeiro.valorMensal, 0);
  const ticketMedio = clientesAssessoriaMensal.length ? mrr / clientesAssessoriaMensal.length : 0;

  const competenciasPeriodo = useMemo(
    () => (mes === "anual" ? MESES.map((m) => `${year}-${m.value}`) : [`${year}-${mes}`]),
    [year, mes]
  );

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
    const boletos = clients.flatMap((c) => {
      const emitidos = boletosMensais.filter((b) => b.clienteId === c.id && b.status === "Emitido" && !b.removido);
      return emitidos.map((b) => {
        const { valor, vencimento, pagamento, status } = resolveBoletoLedger(b, c);
        return {
          id: b.id,
          key: `boleto-${b.id}`,
          nome: c.dados.nomeFantasia ?? c.dados.razaoSocial,
          competencia: b.competencia,
          servico: "Boleto mensal",
          valor,
          vencimento,
          pagamento,
          status,
          banco: b.banco,
          // Boleto de assessoria mensal é sempre recebimento de pessoa jurídica.
          tipoPessoa: "PJ" as const,
          avulso: false as const,
        };
      });
    });
    const parceiros = clients.flatMap((c) => {
      const entradas = recebimentosParceiro.filter((r) => r.clienteId === c.id && !r.removido);
      return entradas.map((r) => ({
        id: r.id,
        key: `parceiro-${r.id}`,
        nome: c.dados.nomeFantasia ?? c.dados.razaoSocial,
        competencia: r.competencia,
        servico: "Recebimento parceiro (PIX)",
        valor: r.valor ?? c.financeiro.valorMensal,
        vencimento: "",
        pagamento: r.dataPagamento,
        status: r.status,
        banco: r.banco,
        tipoPessoa: r.tipoPessoa,
        avulso: false as const,
      }));
    });
    return [...doClientes, ...avulsos, ...boletos, ...parceiros];
  }, [clients, recebimentos, boletosMensais, recebimentosParceiro]);

  const bancosDisponiveis = useMemo(
    () =>
      [...new Set([...recebimentos.map((r) => r.banco), ...boletosMensais.map((b) => b.banco), ...recebimentosParceiro.map((r) => r.banco)].filter(
        (b): b is string => !!b
      ))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [recebimentos, boletosMensais, recebimentosParceiro]
  );

  const ledgerFiltrado = ledgerAll.filter(
    (h) =>
      competenciasPeriodo.includes(h.competencia) &&
      (filtroBanco === TODOS || h.banco === filtroBanco) &&
      (filtroTipo === TODOS || h.tipoPessoa === filtroTipo)
  );

  const ledger = [...ledgerFiltrado].sort((a, b) => b.vencimento.localeCompare(a.vencimento)).slice(0, 30);

  const recebido = ledgerFiltrado.filter((h) => h.status === "Pago").reduce((a, h) => a + h.valor, 0);
  const emAberto = ledgerFiltrado.filter((h) => h.status === "Em aberto").reduce((a, h) => a + h.valor, 0);
  const inadimplencia = ledgerFiltrado.filter((h) => h.status === "Atrasado").reduce((a, h) => a + h.valor, 0);

  const contasAPagar = useMemo(
    () => contasAPagarDoPeriodo(sistemasEscritorio, pagamentosSistemas, despesasAvulsas, competenciasPeriodo),
    [sistemasEscritorio, pagamentosSistemas, despesasAvulsas, competenciasPeriodo]
  );
  const totalPago = contasAPagar.filter((c) => c.status === "Pago").reduce((a, c) => a + c.valor, 0);
  const totalAPagarEmAberto = contasAPagar.filter((c) => c.status === "Em aberto").reduce((a, c) => a + c.valor, 0);

  function handleDeleteRecebimento(id: string, nome: string) {
    if (confirm(`Excluir o recebimento de "${nome}"?`)) deleteRecebimento(id);
  }

  function marcarComoRecebido(id: string) {
    updateRecebimento(id, { status: "Pago", pagamento: new Date().toISOString().slice(0, 10) });
  }

  function marcarContaPaga(linha: ReturnType<typeof contasAPagarDoPeriodo>[number]) {
    const hoje = new Date().toISOString().slice(0, 10);
    if (linha.origem === "sistema") {
      updatePagamentoSistema(linha.refId, linha.competencia, { status: "Pago", dataPagamento: hoje });
    } else {
      updateDespesaAvulsa(linha.refId, { status: "Pago", dataPagamento: hoje });
    }
  }

  function marcarContaEmAberto(linha: ReturnType<typeof contasAPagarDoPeriodo>[number]) {
    if (linha.origem === "sistema") {
      updatePagamentoSistema(linha.refId, linha.competencia, { status: "Em aberto", dataPagamento: undefined });
    } else {
      updateDespesaAvulsa(linha.refId, { status: "Em aberto", dataPagamento: undefined });
    }
  }

  function handleDeleteDespesa(id: string, descricao: string) {
    if (confirm(`Excluir a despesa "${descricao}"?`)) deleteDespesaAvulsa(id);
  }

  return (
    <div>
      <PageHeader
        title="Financeiro"
        description="Honorários, recebimentos, inadimplência e serviços extras da carteira."
        actions={
          <>
            <Link href="/financeiro/conciliacao">
              <Button variant="outline"><Landmark className="size-3.5" /> Conciliação bancária</Button>
            </Link>
            <Button onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Novo recebimento</Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <PeriodChip label="Anual" active={mes === "anual"} onClick={() => setMes("anual")} />
          {MESES.map((m) => (
            <PeriodChip key={m.value} label={m.label} active={mes === m.value} onClick={() => setMes(m.value)} />
          ))}
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="MRR" value={formatCurrency(mrr)} icon={Repeat} tone="wine" />
        <MetricCard label={`Recebido — ${mes === "anual" ? year : `${MESES.find((m) => m.value === mes)?.label}/${year}`}`} value={formatCurrency(recebido)} icon={CircleDollarSign} tone="success" />
        <MetricCard label="Em aberto" value={formatCurrency(emAberto)} icon={Wallet} tone="warning" />
        <MetricCard label="Inadimplência" value={formatCurrency(inadimplencia)} icon={CircleAlert} tone="danger" />
        <MetricCard label="Ticket médio" value={formatCurrency(ticketMedio)} icon={Receipt} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Honorários — {mes === "anual" ? year : `${MESES.find((m) => m.value === mes)?.label}/${year}`}</CardTitle>
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
                    <TableCell>{h.vencimento ? formatDate(h.vencimento) : "—"}</TableCell>
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
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2"><TrendingDown className="size-4 text-status-danger" /> Contas a pagar — {mes === "anual" ? year : `${MESES.find((m) => m.value === mes)?.label}/${year}`}</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setDespesaFormOpen(true)}>
            <Plus className="size-3.5" /> Nova despesa
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MetricCard label="Pago" value={formatCurrency(totalPago)} icon={CircleDollarSign} tone="success" />
            <MetricCard label="Em aberto" value={formatCurrency(totalAPagarEmAberto)} icon={Wallet} tone="warning" />
            <MetricCard label="Total no período" value={formatCurrency(totalPago + totalAPagarEmAberto)} icon={TrendingDown} tone="danger" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contasAPagar.map((linha) => (
                <TableRow key={linha.key}>
                  <TableCell className="font-medium text-sand-800">{linha.descricao}</TableCell>
                  <TableCell className="text-sand-500">{linha.competencia}</TableCell>
                  <TableCell className="text-sand-500">{formatDate(linha.vencimento)}</TableCell>
                  <TableCell>{formatCurrency(linha.valor)}</TableCell>
                  <TableCell><StatusBadge status={linha.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {linha.status === "Pago" ? (
                        <button
                          type="button"
                          onClick={() => marcarContaEmAberto(linha)}
                          title="Reabrir (marcar como em aberto)"
                          className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-warning-bg hover:text-status-warning"
                        >
                          <RotateCcw className="size-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => marcarContaPaga(linha)}
                          title="Marcar como pago"
                          className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-success-bg hover:text-status-success"
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                      {linha.origem === "avulsa" && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDespesa(linha.refId, linha.descricao)}
                          title="Excluir despesa"
                          className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {contasAPagar.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-sand-400">Nenhuma conta a pagar no período.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
      <DespesaFormDialog open={despesaFormOpen} onOpenChange={setDespesaFormOpen} />
    </div>
  );
}

function PeriodChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
        active ? "border-wine-600 bg-wine-700 text-cream-50" : "border-sand-300 bg-white text-sand-600 hover:bg-sand-100"
      )}
    >
      {label}
    </button>
  );
}
