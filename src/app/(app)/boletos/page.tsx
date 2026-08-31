"use client";

import { useMemo, useState } from "react";
import { CreditCard, Send, Clock, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { vencimentoDaCompetencia } from "@/lib/boleto";
import type { Client, StatusEmissaoBoleto } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

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
}

type SortColumn = "cliente" | "competencia" | "valor" | "vencimento" | "status";

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
  const setBoletoStatus = useAppStore((s) => s.setBoletoStatus);

  const [busca, setBusca] = useState("");
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" } | null>(null);
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));

  const clientesMensais = useMemo(() => clients.filter((c) => c.financeiro.valorMensal > 0), [clients]);

  function toggleSort(column: SortColumn) {
    setSort((s) => (s?.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }));
  }

  const competencias = mes === "anual" ? MESES.map((m) => `${year}-${m.value}`) : [`${year}-${mes}`];

  const linhas: Linha[] = useMemo(() => {
    const statusMap = new Map(boletosMensais.map((b) => [`${b.clienteId}__${b.competencia}`, b.status]));
    const list: Linha[] = [];
    for (const cliente of clientesMensais) {
      for (const competencia of competencias) {
        list.push({
          cliente,
          competencia,
          valor: cliente.financeiro.valorMensal,
          vencimento: vencimentoDaCompetencia(competencia, cliente.financeiro.vencimentoDia),
          status: statusMap.get(`${cliente.id}__${competencia}`) ?? "Não emitido",
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

  function toggleStatus(l: Linha) {
    setBoletoStatus(l.cliente.id, l.competencia, l.status === "Emitido" ? "Não emitido" : "Emitido");
  }

  return (
    <div>
      <PageHeader
        title="Boletos"
        description="Emissão mensal de boletos de todos os clientes com mensalidade — valor e vencimento vêm direto do cadastro do cliente."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Boletos no período" value={filtradas.length} icon={CreditCard} tone="wine" />
        <MetricCard label="Emitidos" value={emitidos} icon={Send} tone="success" />
        <MetricCard label="Não emitidos" value={naoEmitidos} icon={Clock} tone="warning" />
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
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead label="Cliente" column="cliente" sort={sort} onSort={toggleSort} />
                <SortableHead label="Competência" column="competencia" sort={sort} onSort={toggleSort} />
                <SortableHead label="Valor" column="valor" sort={sort} onSort={toggleSort} />
                <SortableHead label="Vencimento" column="vencimento" sort={sort} onSort={toggleSort} />
                <SortableHead label="Status" column="status" sort={sort} onSort={toggleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((l) => (
                <TableRow key={`${l.cliente.id}-${l.competencia}`}>
                  <TableCell className="font-medium">{l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial}</TableCell>
                  <TableCell className="text-sand-500">{l.competencia}</TableCell>
                  <TableCell>{formatCurrency(l.valor)}</TableCell>
                  <TableCell className="text-sand-500">{formatDate(l.vencimento)}</TableCell>
                  <TableCell>
                    <button type="button" onClick={() => toggleStatus(l)} title="Alternar status de emissão">
                      <StatusBadge status={l.status} className="cursor-pointer" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sand-400">Nenhum cliente mensal encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
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
