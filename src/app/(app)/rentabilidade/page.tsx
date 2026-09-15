"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PiggyBank, Search, Info, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/lib/store/app-store";
import { calcularRentabilidade, type ItemCustoCliente } from "@/lib/rentabilidade";
import { cn, formatCurrency } from "@/lib/utils";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

function margemTone(percentual: number): string {
  if (percentual < 20) return "text-status-danger";
  if (percentual < 50) return "text-status-warning";
  return "text-status-success";
}

export default function RentabilidadePage() {
  const clients = useAppStore((s) => s.clients);
  const sistemasEscritorio = useAppStore((s) => s.sistemasEscritorio);
  const pagamentosSistemas = useAppStore((s) => s.pagamentosSistemas);
  const despesasAvulsas = useAppStore((s) => s.despesasAvulsas);
  const updateSistemaEscritorio = useAppStore((s) => s.updateSistemaEscritorio);
  const updateDespesaAvulsa = useAppStore((s) => s.updateDespesaAvulsa);
  const [busca, setBusca] = useState("");
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [detalheClienteId, setDetalheClienteId] = useState<string | null>(null);

  const competencia = `${year}-${mes}`;

  const totalDespesasDoMes = useMemo(() => {
    return sistemasEscritorio.filter((s) => s.valorMensal).reduce((a, s) => a + (s.valorMensal ?? 0), 0)
      + despesasAvulsas.filter((d) => d.vencimento.slice(0, 7) === competencia).reduce((a, d) => a + d.valor, 0);
  }, [sistemasEscritorio, despesasAvulsas, competencia]);

  const linhas = useMemo(() => {
    const calculadas = calcularRentabilidade(clients, sistemasEscritorio, pagamentosSistemas, despesasAvulsas, competencia);
    return calculadas
      .filter((l) => !busca.trim() || l.nome.toLowerCase().includes(busca.trim().toLowerCase()))
      .sort((a, b) => a.margemPercentual - b.margemPercentual);
  }, [clients, sistemasEscritorio, pagamentosSistemas, despesasAvulsas, competencia, busca]);

  const receitaTotal = linhas.reduce((a, l) => a + l.receita, 0);
  const custoTotal = linhas.reduce((a, l) => a + l.custo, 0);
  const margemTotal = receitaTotal - custoTotal;
  const margemMediaPercentual = receitaTotal > 0 ? (margemTotal / receitaTotal) * 100 : 0;

  // Deriva do array recalculado (em vez de guardar uma cópia) pra o diálogo
  // atualizar sozinho assim que um item é removido do cliente.
  const detalheCliente = linhas.find((l) => l.clienteId === detalheClienteId) ?? null;

  /** Tira esse cliente da lista de quem usa esse sistema/despesa — sem
   * precisar abrir o cadastro do sistema/despesa e procurar o cliente lá.
   * Sistema/despesa sem ninguém marcado ainda (undefined = "todos") vira uma
   * lista explícita com todo mundo menos esse cliente. */
  function handleRemoverItem(item: ItemCustoCliente, clienteId: string) {
    if (item.origemTipo === "sistema") {
      const sistema = sistemasEscritorio.find((s) => s.id === item.origemId);
      if (!sistema) return;
      const atuais = sistema.clientesQueUsam ?? clients.map((c) => c.id);
      updateSistemaEscritorio(sistema.id, { clientesQueUsam: atuais.filter((id) => id !== clienteId) });
    } else {
      const despesa = despesasAvulsas.find((d) => d.id === item.origemId);
      if (!despesa) return;
      const atuais = despesa.clientesQueUsam ?? clients.map((c) => c.id);
      updateDespesaAvulsa(despesa.id, { clientesQueUsam: atuais.filter((id) => id !== clienteId) });
    }
  }

  return (
    <div>
      <PageHeader
        title="Rentabilidade por cliente"
        description="Estimativa de margem: honorário mensal menos a fatia das despesas da empresa naquele mês."
      />

      {totalDespesasDoMes === 0 && (
        <Card className="mb-6 border-status-warning/40 bg-status-warning-bg">
          <CardContent className="flex items-start gap-2 p-4 text-xs text-status-warning">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              Nenhuma despesa lançada nessa competência ainda, então o custo estimado aparece zerado. Lance sistemas e
              despesas avulsas em <Link href="/dados-escritorio" className="underline">Dados do escritório</Link> e{" "}
              <Link href="/financeiro" className="underline">Financeiro → Contas a pagar</Link>.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Receita mensal total" value={formatCurrency(receitaTotal)} icon={PiggyBank} tone="wine" />
        <MetricCard label="Despesas da empresa no mês" value={formatCurrency(totalDespesasDoMes)} icon={PiggyBank} tone="neutral" />
        <MetricCard label="Margem total" value={formatCurrency(margemTotal)} icon={PiggyBank} tone={margemTotal >= 0 ? "success" : "danger"} />
        <MetricCard label="Margem média" value={`${margemMediaPercentual.toFixed(1)}%`} icon={PiggyBank} tone="success" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por cliente" className="pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes ({linhas.length}) — piores margens primeiro</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            Custo estimado divide cada sistema/despesa da competência entre os clientes que usam aquele item —
            configurável em cada sistema (Dados do escritório) e despesa avulsa (Financeiro → Contas a pagar).
            Sistema/despesa sem ninguém marcado ainda rateia entre todos os clientes ativos.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-36">Receita mensal</TableHead>
                <TableHead className="w-36">Custo estimado</TableHead>
                <TableHead className="w-36">Margem</TableHead>
                <TableHead className="w-24 text-right">Margem %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.clienteId}>
                  <TableCell className="font-medium">
                    <Link href={`/clientes/${l.clienteId}`} className="hover:text-wine-700 hover:underline">{l.nome}</Link>
                  </TableCell>
                  <TableCell>{formatCurrency(l.receita)}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setDetalheClienteId(l.clienteId)}
                      className="underline decoration-dotted underline-offset-2 hover:text-wine-700"
                      title="Ver quais sistemas/despesas compõem esse custo"
                    >
                      {formatCurrency(l.custo)}
                    </button>
                  </TableCell>
                  <TableCell className={cn("font-medium", margemTone(l.margemPercentual))}>{formatCurrency(l.margem)}</TableCell>
                  <TableCell className={cn("text-right font-medium", margemTone(l.margemPercentual))}>
                    {l.margemPercentual.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              {linhas.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sand-400">Nenhum cliente com honorário cadastrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detalheClienteId} onOpenChange={(open) => !open && setDetalheClienteId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sistemas e despesas que {detalheCliente?.nome} consome</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sistema / despesa</TableHead>
                <TableHead className="text-right">Fatia do custo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalheCliente?.itens.map((item, i) => (
                <TableRow key={`${item.nome}-${i}`}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.valor)}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleRemoverItem(item, detalheCliente!.clienteId)}
                      title="Esse cliente não usa isso — remover do rateio"
                      className="rounded-md p-1 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                    >
                      <X className="size-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {detalheCliente?.itens.length === 0 && (
                <TableRow><TableCell colSpan={3} className="py-8 text-center text-sand-400">Esse cliente não está marcado como usuário de nenhum sistema/despesa nessa competência.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {detalheCliente && (
            <div className="mt-3 flex items-center justify-between border-t border-sand-200 pt-3 text-sm font-semibold text-sand-900">
              <span>Total ({detalheCliente.itens.length} itens)</span>
              <span>{formatCurrency(detalheCliente.custo)}</span>
            </div>
          )}
          <p className="text-xs text-sand-500">
            Clique no × pra tirar esse cliente do rateio de um item direto por aqui — mais rápido do que abrir o
            sistema (Dados do escritório) ou a despesa (Financeiro → Contas a pagar) pra procurar o cliente na lista.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
