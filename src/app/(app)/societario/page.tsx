"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scale, Plus, Wallet, CircleDollarSign, Hourglass } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProcessoFormDialog } from "@/components/societario/processo-form-dialog";
import { ProcessoDetailDialog } from "@/components/societario/processo-detail-dialog";
import { AberturaMatrix } from "@/components/societario/abertura-matrix";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import type { ProcessoSocietario } from "@/lib/types";
import { resumoFinanceiroSocietario } from "@/lib/societario-financeiro";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type ViewMode = "tabela" | "processo" | "etapa" | "financeiro";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

export default function SocietarioPage() {
  const clients = useAppStore((s) => s.clients);
  const processos = useAppStore((s) => s.processosSocietarios);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");
  const [selected, setSelected] = useState<ProcessoSocietario | null>(null);
  const [view, setView] = useState<ViewMode>("tabela");

  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>("anual");

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/societario");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myClients = clients.filter((c) => c.responsaveis.societario);
  const emAndamento = processos.filter((p) => p.status !== "Finalizado").length;
  const emExigencia = processos.filter((p) => p.status === "Exigência").length;

  const filtered = useMemo(
    () => processos.filter((p) => p.dataAbertura.startsWith(year)),
    [processos, year]
  );

  const porProcesso = useMemo(() => {
    const map = new Map<string, ProcessoSocietario[]>();
    for (const p of filtered) map.set(p.tipoServico, [...(map.get(p.tipoServico) ?? []), p]);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const filteredPeriodo = useMemo(
    () => filtered.filter((p) => mes === "anual" || p.dataAbertura.startsWith(`${year}-${mes}`)),
    [filtered, mes, year]
  );

  const aberturas = filteredPeriodo.filter(
    (p) => (p.tipoServico === "Abertura" || p.tipoServico === "Abertura de empresa") && (p.etapas ?? []).length > 0
  );

  const resumoFinanceiro = useMemo(() => resumoFinanceiroSocietario(filteredPeriodo), [filteredPeriodo]);

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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
            <TabsTrigger value="processo">Por processo</TabsTrigger>
            <TabsTrigger value="etapa">Por etapa</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {(view === "etapa" || view === "financeiro") && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <PeriodChip label="Anual" active={mes === "anual"} onClick={() => setMes("anual")} />
          {MESES.map((m) => (
            <PeriodChip key={m.value} label={m.label} active={mes === m.value} onClick={() => setMes(m.value)} />
          ))}
        </div>
      )}

      {view === "tabela" && (
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
                {filtered.map((p) => {
                  const client = clients.find((c) => c.id === p.clienteId);
                  return (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                      <TableCell className="font-medium">{client?.dados.nomeFantasia ?? client?.dados.razaoSocial}</TableCell>
                      <TableCell>{p.tipoServico}</TableCell>
                      <TableCell>{p.orgao ?? "—"}</TableCell>
                      <TableCell className="text-sand-500">{p.protocolo ?? "—"}</TableCell>
                      <TableCell>{teamName(p.responsavelId)}</TableCell>
                      <TableCell>{p.prazo ? formatDate(p.prazo) : "—"}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhum processo neste ano.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {view === "processo" && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {porProcesso.map(([tipo, items]) => (
            <div key={tipo} className="w-72 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-sand-500">{tipo}</h3>
                <span className="text-[11px] font-medium text-sand-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((p) => {
                  const client = clients.find((c) => c.id === p.clienteId);
                  return (
                    <Card key={p.id} className="cursor-pointer transition-colors hover:border-wine-300" onClick={() => setSelected(p)}>
                      <CardContent className="space-y-1.5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium text-sand-900">{client?.dados.nomeFantasia ?? client?.dados.razaoSocial}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-sand-500">
                          <span>{p.orgao ?? "—"}</span>
                          <span>Prazo {p.prazo ? formatDate(p.prazo) : "—"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
          {porProcesso.length === 0 && <p className="py-10 text-center text-sand-400">Nenhum processo neste ano.</p>}
        </div>
      )}

      {view === "etapa" && (
        <div>
          <p className="mb-3 text-[11px] text-sand-500">
            Checklist de abertura de empresa, no mesmo formato do controle societário — clique em qualquer célula para mudar o status.
          </p>
          <AberturaMatrix processos={aberturas} clients={clients} />
        </div>
      )}

      {view === "financeiro" && (
        <div>
          <p className="mb-3 text-[11px] text-sand-500">
            Valores cobrados nos processos societários de {mes === "anual" ? year : `${MESES.find((m) => m.value === mes)?.label}/${year}`} (campo R$/Valor de cada processo). Esses mesmos números aparecem na página Financeiro.
          </p>
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MetricCard label="Total cobrado" value={formatCurrency(resumoFinanceiro.total)} icon={Wallet} tone="wine" />
            <MetricCard label="Recebido" value={formatCurrency(resumoFinanceiro.recebido)} icon={CircleDollarSign} tone="success" />
            <MetricCard label="A receber" value={formatCurrency(resumoFinanceiro.aReceber)} icon={Hourglass} tone="warning" />
          </div>
          <Card>
            <CardHeader><CardTitle>Quanto cada serviço rendeu</CardTitle></CardHeader>
            <CardContent className="pt-4">
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
                  {resumoFinanceiro.porServico.map((s) => (
                    <TableRow key={s.tipoServico}>
                      <TableCell className="font-medium">{s.tipoServico}</TableCell>
                      <TableCell>{s.qtd}</TableCell>
                      <TableCell>{formatCurrency(s.total)}</TableCell>
                      <TableCell className="text-status-success">{formatCurrency(s.recebido)}</TableCell>
                      <TableCell className="text-status-warning">{formatCurrency(s.aReceber)}</TableCell>
                    </TableRow>
                  ))}
                  {resumoFinanceiro.porServico.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-10 text-center text-sand-400">Nenhum processo com valor informado neste ano.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <ProcessoFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ProcessoDetailDialog processo={selected} onClose={() => setSelected(null)} />
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
