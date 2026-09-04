"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ObligationFormDialog } from "@/components/obligations/obligation-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { OBLIGATION_STATUS, type Obligation } from "@/lib/types";
import { formatDate, cn } from "@/lib/utils";

const PENDENTES: Obligation["status"][] = ["A fazer", "Em andamento", "Aguardando informação", "Em atraso"];

export default function ObrigacoesPage() {
  const obligations = useAppStore((s) => s.obligations);
  const clients = useAppStore((s) => s.clients);
  const updateObligation = useAppStore((s) => s.updateObligation);
  const deleteObligation = useAppStore((s) => s.deleteObligation);

  const [query, setQuery] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState("Pendentes");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Obligation | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);

  function abrirNova() {
    setEditing(null);
    setFormOpen(true);
  }
  function abrirEdicao(o: Obligation) {
    setEditing(o);
    setFormOpen(true);
  }
  function excluir(o: Obligation) {
    if (confirm(`Excluir a obrigação "${o.tipo}"?`)) deleteObligation(o.id);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return obligations
      .map((o) => ({ obligation: o, cliente: clients.find((c) => c.id === o.clienteId) }))
      .filter(({ obligation: o, cliente }) => {
        const nomeCliente = cliente?.dados.nomeFantasia ?? cliente?.dados.razaoSocial ?? "";
        const matchesQuery = q === "" || o.tipo.toLowerCase().includes(q) || nomeCliente.toLowerCase().includes(q);
        const matchesCliente = clienteFiltro === "Todos" || o.clienteId === clienteFiltro;
        const matchesStatus =
          statusFiltro === "Todas" ? true : statusFiltro === "Pendentes" ? PENDENTES.includes(o.status) : o.status === statusFiltro;
        return matchesQuery && matchesCliente && matchesStatus;
      })
      .sort((a, b) => a.obligation.vencimento.localeCompare(b.obligation.vencimento));
  }, [obligations, clients, query, clienteFiltro, statusFiltro]);

  const totalPendentes = obligations.filter((o) => PENDENTES.includes(o.status)).length;
  const totalAtrasadas = obligations.filter((o) => o.status === "Em atraso" || (o.vencimento < hoje && PENDENTES.includes(o.status))).length;

  return (
    <div>
      <PageHeader
        title="Obrigações"
        description="Visão geral do que está pendente de cada cliente — DAS, DCTFWeb, ISS e demais obrigações fiscais."
        actions={<Button onClick={abrirNova}><Plus className="size-3.5" /> Nova obrigação</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <span className="rounded-full bg-status-warning-bg px-3 py-1 font-medium text-status-warning">
          {totalPendentes} pendente{totalPendentes === 1 ? "" : "s"}
        </span>
        {totalAtrasadas > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-status-danger-bg px-3 py-1 font-medium text-status-danger">
            <AlertTriangle className="size-3" /> {totalAtrasadas} em atraso
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input placeholder="Buscar obrigação ou cliente" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os clientes</SelectItem>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Pendentes">Pendentes</SelectItem>
            <SelectItem value="Todas">Todos os status</SelectItem>
            {OBLIGATION_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Obrigação</TableHead>
            <TableHead>Competência</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(({ obligation: o, cliente }) => {
            const atrasada = o.vencimento < hoje && PENDENTES.includes(o.status);
            return (
              <TableRow key={o.id}>
                <TableCell>
                  {cliente ? (
                    <Link href={`/clientes/${cliente.id}`} className="font-medium text-sand-900 hover:text-wine-700 hover:underline">
                      {cliente.dados.nomeFantasia ?? cliente.dados.razaoSocial}
                    </Link>
                  ) : (
                    <span className="text-sand-400">—</span>
                  )}
                </TableCell>
                <TableCell className="flex items-center gap-2 font-medium text-sand-900">
                  <CalendarClock className="size-3.5 shrink-0 text-wine-500" /> {o.tipo}
                </TableCell>
                <TableCell>{o.competencia}</TableCell>
                <TableCell className={cn(atrasada && "font-semibold text-status-danger")}>{formatDate(o.vencimento)}</TableCell>
                <TableCell>{teamName(o.responsavelId)}</TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={(v) => updateObligation(o.id, { status: v as Obligation["status"] })}>
                    <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OBLIGATION_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEdicao(o)}
                      className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(o)}
                      className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhuma obrigação encontrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <ObligationFormDialog open={formOpen} onOpenChange={setFormOpen} obligation={editing} />
    </div>
  );
}
