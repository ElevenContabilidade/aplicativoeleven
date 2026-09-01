"use client";

import { useMemo, useState } from "react";
import { CreditCard, Send, Clock, CircleDollarSign, Search, ArrowUp, ArrowDown, ArrowUpDown, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { vencimentoDaCompetencia } from "@/lib/boleto";
import type { Client, StatusEmissaoBoleto } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

interface Linha {
  cliente: Client;
  competencia: string;
  valor: number;
  vencimento: string;
  status: StatusEmissaoBoleto;
  recebido: boolean;
  dataRecebimento: string;
  valorRecebido: number;
  banco: string;
}

type SortColumn = "cliente" | "valor" | "vencimento" | "status";

function SortableHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  sort: { column: SortColumn; direction: "asc" | "desc" } | null;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const active = sort?.column === column;
  const Icon = active ? (sort!.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn("flex items-center gap-1 uppercase tracking-wide hover:text-wine-700", active && "text-wine-700")}
      >
        {label}
        <Icon className={cn("size-3", !active && "text-sand-300")} />
      </button>
    </TableHead>
  );
}

export default function BoletosPage() {
  const clients = useAppStore((s) => s.clients);
  const boletosMensais = useAppStore((s) => s.boletosMensais);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const updateBoleto = useAppStore((s) => s.updateBoleto);

  const bancoOptions = useMemo(() => {
    const usados = [...boletosMensais.map((b) => b.banco), ...recebimentos.map((r) => r.banco)].filter((b): b is string => !!b);
    return [...new Set(usados)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [boletosMensais, recebimentos]);

  const [busca, setBusca] = useState("");
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" } | null>(null);
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));

  const clientesMensais = useMemo(
    () => clients.filter((c) => c.financeiro.valorMensal > 0 && !c.dados.clienteParceiro),
    [clients]
  );

  function toggleSort(column: SortColumn) {
    setSort((s) => (s?.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }));
  }

  const competencias = mes === "anual" ? MESES.map((m) => `${year}-${m.value}`) : [`${year}-${mes}`];

  const linhas: Linha[] = useMemo(() => {
    const entryMap = new Map(boletosMensais.map((b) => [`${b.clienteId}__${b.competencia}`, b]));
    const list: Linha[] = [];
    for (const cliente of clientesMensais) {
      for (const competencia of competencias) {
        const entry = entryMap.get(`${cliente.id}__${competencia}`);
        if (entry?.removido) continue;
        const valor = entry?.valor ?? cliente.financeiro.valorMensal;
        list.push({
          cliente,
          competencia,
          valor,
          vencimento: entry?.vencimento ?? vencimentoDaCompetencia(competencia, cliente.financeiro.vencimentoDia),
          status: entry?.status ?? "Não emitido",
          recebido: entry?.recebido ?? false,
          dataRecebimento: entry?.dataRecebimento ?? "",
          valorRecebido: entry?.valorRecebido ?? valor,
          banco: entry?.banco ?? "",
        });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientesMensais, boletosMensais, year, mes]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter((l) => (l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial).toLowerCase().includes(q));
  }, [linhas, busca]);

  const sorted = useMemo(() => {
    if (!sort) return filtradas;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      const { column } = sort;
      if (column === "valor") return (a.valor - b.valor) * dir;
      if (column === "cliente") {
        const an = a.cliente.dados.nomeFantasia ?? a.cliente.dados.razaoSocial;
        const bn = b.cliente.dados.nomeFantasia ?? b.cliente.dados.razaoSocial;
        return an.localeCompare(bn, "pt-BR") * dir;
      }
      return a[column].localeCompare(b[column], "pt-BR") * dir;
    });
  }, [filtradas, sort]);

  const emitidos = filtradas.filter((l) => l.status === "Emitido").length;
  const naoEmitidos = filtradas.filter((l) => l.status === "Não emitido").length;
  const recebidoTotal = filtradas.filter((l) => l.recebido).reduce((a, l) => a + l.valorRecebido, 0);

  function toggleStatus(l: Linha) {
    updateBoleto(l.cliente.id, l.competencia, { status: l.status === "Emitido" ? "Não emitido" : "Emitido" });
  }

  function toggleRecebido(l: Linha) {
    const recebido = !l.recebido;
    updateBoleto(l.cliente.id, l.competencia, {
      recebido,
      dataRecebimento: recebido && !l.dataRecebimento ? new Date().toISOString().slice(0, 10) : l.dataRecebimento,
    });
  }

  function handleDelete(l: Linha) {
    const nome = l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial;
    if (confirm(`Excluir o boleto de ${nome} em ${l.competencia}? Ele some da lista deste mês.`)) {
      updateBoleto(l.cliente.id, l.competencia, { removido: true });
    }
  }

  return (
    <div>
      <PageHeader
        title="Boletos"
        description="Emissão mensal de boletos de todos os clientes com mensalidade — valor e vencimento vêm direto do cadastro do cliente, mas podem ser ajustados por competência."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Boletos no período" value={filtradas.length} icon={CreditCard} tone="wine" />
        <MetricCard label="Emitidos" value={emitidos} icon={Send} tone="success" />
        <MetricCard label="Não emitidos" value={naoEmitidos} icon={Clock} tone="warning" />
        <MetricCard label="Recebido" value={formatCurrency(recebidoTotal)} icon={CircleDollarSign} tone="success" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por cliente" className="pl-8" />
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <PeriodChip label="Anual" active={mes === "anual"} onClick={() => setMes("anual")} />
        {MESES.map((m) => (
          <PeriodChip key={m.value} label={m.label} active={mes === m.value} onClick={() => setMes(m.value)} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Boletos de {mes === "anual" ? year : `${MESES.find((m) => m.value === mes)?.label}/${year}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow>
                  <SortableHead label="Cliente" column="cliente" sort={sort} onSort={toggleSort} />
                  <SortableHead label="Valor" column="valor" sort={sort} onSort={toggleSort} className="w-32" />
                  <SortableHead label="Vencimento" column="vencimento" sort={sort} onSort={toggleSort} className="w-40" />
                  <SortableHead label="Status" column="status" sort={sort} onSort={toggleSort} />
                  <TableHead className="w-36">Banco</TableHead>
                  <TableHead className="w-24 text-center">Recebido</TableHead>
                  <TableHead className="w-40">Data recebimento</TableHead>
                  <TableHead className="w-32">Valor recebido</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((l) => (
                  <TableRow key={`${l.cliente.id}-${l.competencia}`}>
                    <TableCell className="font-medium">{l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.valor}
                        onChange={(e) => updateBoleto(l.cliente.id, l.competencia, { valor: Number(e.target.value) || 0 })}
                        className="h-8 w-28 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={l.vencimento}
                        onChange={(e) => updateBoleto(l.cliente.id, l.competencia, { vencimento: e.target.value })}
                        className="h-8 w-36 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <button type="button" onClick={() => toggleStatus(l)} title="Alternar status de emissão">
                        <StatusBadge status={l.status} className="cursor-pointer" />
                      </button>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={l.banco}
                        onChange={(e) => updateBoleto(l.cliente.id, l.competencia, { banco: e.target.value })}
                        placeholder="Em qual banco"
                        list="boletos-bancos"
                        className="h-8 w-32 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={l.recebido}
                        disabled={l.status !== "Emitido"}
                        onCheckedChange={() => toggleRecebido(l)}
                        title={l.status !== "Emitido" ? "Emita o boleto antes de marcar como recebido" : "Marcar como recebido"}
                        className="mx-auto"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={l.dataRecebimento}
                        disabled={!l.recebido}
                        onChange={(e) => updateBoleto(l.cliente.id, l.competencia, { dataRecebimento: e.target.value })}
                        className="h-8 w-36 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.valorRecebido}
                        disabled={!l.recebido}
                        onChange={(e) => updateBoleto(l.cliente.id, l.competencia, { valorRecebido: Number(e.target.value) || 0 })}
                        className="h-8 w-28 text-xs"
                        title="Pode diferir do valor original por juros/multa ou desconto"
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleDelete(l)}
                        title="Excluir boleto"
                        className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
                {sorted.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="py-10 text-center text-sand-400">Nenhum cliente mensal encontrado.</TableCell></TableRow>
                )}
              </TableBody>
          </Table>
          <datalist id="boletos-bancos">
            {bancoOptions.map((b) => (<option key={b} value={b} />))}
          </datalist>
        </CardContent>
      </Card>
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
