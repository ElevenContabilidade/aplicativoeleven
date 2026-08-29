"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Scale, Plus } from "lucide-react";
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
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import { CHECKLIST_STATUS, type ChecklistStatus, type ProcessoSocietario } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

type ViewMode = "tabela" | "processo" | "etapa";

const ETAPA_STATUS_STYLE: Record<ChecklistStatus, string> = {
  OK: "border-status-success bg-status-success-bg text-status-success",
  Pendente: "border-status-danger bg-status-danger-bg text-status-danger",
  "Em andamento": "border-status-warning bg-status-warning-bg text-status-warning",
  Dispensada: "border-status-brown bg-status-brown-bg text-status-brown",
};

function isDone(status: ChecklistStatus) {
  return status === "OK" || status === "Dispensada";
}

export default function SocietarioPage() {
  const clients = useAppStore((s) => s.clients);
  const processos = useAppStore((s) => s.processosSocietarios);
  const setEtapaStatus = useAppStore((s) => s.setEtapaStatus);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");
  const [selected, setSelected] = useState<ProcessoSocietario | null>(null);
  const [view, setView] = useState<ViewMode>("tabela");

  const years = useMemo(() => {
    const set = new Set(processos.map((p) => p.dataAbertura.slice(0, 4)));
    set.add(new Date().getFullYear().toString());
    return [...set].sort().reverse();
  }, [processos]);
  const [year, setYear] = useState(years[0]);

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

  const comEtapas = filtered.filter((p) => (p.etapas ?? []).length > 0);

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
          </TabsList>
        </Tabs>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

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
                      <TableCell>{p.orgao}</TableCell>
                      <TableCell className="text-sand-500">{p.protocolo ?? "—"}</TableCell>
                      <TableCell>{teamName(p.responsavelId)}</TableCell>
                      <TableCell>{formatDate(p.prazo)}</TableCell>
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
                          <span>{p.orgao}</span>
                          <span>Prazo {formatDate(p.prazo)}</span>
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
        <div className="space-y-4">
          {comEtapas.map((p) => {
            const client = clients.find((c) => c.id === p.clienteId);
            const feitas = p.etapas.filter((e) => isDone(e.status)).length;
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle>
                    {client?.dados.nomeFantasia ?? client?.dados.razaoSocial} <span className="font-normal text-sand-400">· {p.tipoServico}</span>
                  </CardTitle>
                  <button onClick={() => setSelected(p)} className="text-xs font-medium text-wine-700 hover:underline">
                    {feitas}/{p.etapas.length} concluídas
                  </button>
                </CardHeader>
                <CardContent className="space-y-1.5 pt-4">
                  {p.etapas.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-sand-50">
                      <span className={isDone(e.status) ? "flex-1 text-sand-400 line-through" : "flex-1 text-sand-800"}>{e.descricao}</span>
                      <span className="text-sand-400">{teamName(e.responsavelId)} · prazo {formatDate(e.prazo)}</span>
                      <Select value={e.status} onValueChange={(v) => setEtapaStatus(p.id, e.id, v as ChecklistStatus)}>
                        <SelectTrigger className={cn("h-7 w-28 shrink-0 justify-center px-2 text-[11px] font-semibold uppercase", ETAPA_STATUS_STYLE[e.status])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHECKLIST_STATUS.map((s) => (
                            <SelectItem key={s} value={s} className="uppercase">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
          {comEtapas.length === 0 && <p className="py-10 text-center text-sand-400">Nenhum processo com etapas cadastradas neste ano.</p>}
        </div>
      )}

      <ProcessoFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ProcessoDetailDialog processo={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
