"use client";

import { useMemo, useState } from "react";
import { TrendingUp, Receipt, Percent, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { setorAtendidoPelaEleven } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

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

export default function FaturamentoPage() {
  const clients = useAppStore((s) => s.clients);
  const faturamentoMensal = useAppStore((s) => s.faturamentoMensal);
  const updateFaturamentoMensal = useAppStore((s) => s.updateFaturamentoMensal);

  const [busca, setBusca] = useState("");
  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, "0"));

  const clientesAtendidos = useMemo(
    () =>
      clients.filter(
        (c) => (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding") && setorAtendidoPelaEleven(c, "fiscal")
      ),
    [clients]
  );

  const competencia = `${year}-${mes}`;

  const linhas = useMemo(() => {
    const entryMap = new Map(faturamentoMensal.map((f) => [`${f.clienteId}__${f.competencia}`, f]));
    return clientesAtendidos
      .filter((c) => !c.financeiro.inicioContrato || competencia >= c.financeiro.inicioContrato.slice(0, 7))
      .map((cliente) => {
        const entry = entryMap.get(`${cliente.id}__${competencia}`);
        return {
          cliente,
          faturamento: entry?.faturamento ?? 0,
          imposto: entry?.imposto ?? 0,
          observacao: entry?.observacao ?? "",
        };
      });
  }, [clientesAtendidos, faturamentoMensal, competencia]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return linhas;
    return linhas.filter((l) => (l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial).toLowerCase().includes(q));
  }, [linhas, busca]);

  const totalFaturamento = filtradas.reduce((a, l) => a + l.faturamento, 0);
  const totalImposto = filtradas.reduce((a, l) => a + l.imposto, 0);
  const cargaMedia = totalFaturamento > 0 ? (totalImposto / totalFaturamento) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Faturamento"
        description="Faturamento e imposto pago por cliente em cada competência — lançado a partir da guia do mês (PGDAS, DAS etc). Alimenta o dashboard que o cliente vê no Portal."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Faturamento no período" value={formatCurrency(totalFaturamento)} icon={TrendingUp} tone="wine" />
        <MetricCard label="Imposto no período" value={formatCurrency(totalImposto)} icon={Receipt} tone="warning" />
        <MetricCard label="Carga tributária média" value={`${cargaMedia.toFixed(1)}%`} icon={Percent} tone="success" />
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
        {MESES.map((m) => (
          <PeriodChip key={m.value} label={m.label} active={mes === m.value} onClick={() => setMes(m.value)} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faturamento de {MESES.find((m) => m.value === mes)?.label}/{year}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-40">Faturamento</TableHead>
                <TableHead className="w-40">Imposto pago</TableHead>
                <TableHead className="w-28">Carga tributária</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.map((l) => {
                const carga = l.faturamento > 0 ? (l.imposto / l.faturamento) * 100 : 0;
                return (
                  <TableRow key={l.cliente.id}>
                    <TableCell className="font-medium">{l.cliente.dados.nomeFantasia ?? l.cliente.dados.razaoSocial}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.faturamento || ""}
                        onChange={(e) => updateFaturamentoMensal(l.cliente.id, competencia, { faturamento: Number(e.target.value) || 0 })}
                        className="h-8 w-32 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={l.imposto || ""}
                        onChange={(e) => updateFaturamentoMensal(l.cliente.id, competencia, { imposto: Number(e.target.value) || 0 })}
                        className="h-8 w-32 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-sand-600">{l.faturamento > 0 ? `${carga.toFixed(1)}%` : "—"}</TableCell>
                    <TableCell>
                      <Input
                        value={l.observacao}
                        onChange={(e) => updateFaturamentoMensal(l.cliente.id, competencia, { observacao: e.target.value })}
                        placeholder="Ex: número do PGDAS, ajuste, etc."
                        className="h-8 text-xs"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtradas.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sand-400">Nenhum cliente encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
