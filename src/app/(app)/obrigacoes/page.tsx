"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ObligationFormDialog } from "@/components/obligations/obligation-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { rotinasDepartamentosDoMes, type RotinaDepartamento, type SetorRotina } from "@/lib/obrigacoes-departamentos";
import { CHECKLIST_STATUS, OBLIGATION_STATUS, type Obligation, type ChecklistStatus } from "@/lib/types";
import type { BadgeTone } from "@/lib/status";
import { formatDate, cn } from "@/lib/utils";

const PENDENTES_MANUAL: Obligation["status"][] = ["A fazer", "Em andamento", "Aguardando informação", "Em atraso"];
const PENDENTES_DEPTO: ChecklistStatus[] = ["Pendente", "Em andamento"];

const MESES = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];
const YEARS = Array.from({ length: 2034 - 2024 + 1 }, (_, i) => String(2024 + i)).reverse();

const SETOR_STYLE: Record<SetorRotina | "Manual", BadgeTone> = {
  Fiscal: "wine",
  Contábil: "info",
  "Departamento Pessoal": "cream",
  MEI: "outline",
  Manual: "neutral",
};

type Linha =
  | { kind: "manual"; id: string; clienteId: string; tipo: string; setor: "Manual"; vencimento: string; responsavelId: string; status: string; pendente: boolean; obligation: Obligation }
  | { kind: "departamento"; id: string; clienteId: string; tipo: string; setor: SetorRotina; vencimento: null; responsavelId: null; status: string; pendente: boolean; rotina: RotinaDepartamento };

export default function ObrigacoesPage() {
  const obligations = useAppStore((s) => s.obligations);
  const clients = useAppStore((s) => s.clients);
  const checklistFiscal = useAppStore((s) => s.checklistFiscal);
  const checklistContabil = useAppStore((s) => s.checklistContabil);
  const checklistPessoal = useAppStore((s) => s.checklistPessoal);
  const checklistMei = useAppStore((s) => s.checklistMei);
  const updateObligation = useAppStore((s) => s.updateObligation);
  const deleteObligation = useAppStore((s) => s.deleteObligation);
  const setChecklistFiscal = useAppStore((s) => s.setChecklistFiscal);
  const setChecklistContabil = useAppStore((s) => s.setChecklistContabil);
  const setChecklistPessoal = useAppStore((s) => s.setChecklistPessoal);
  const setChecklistMei = useAppStore((s) => s.setChecklistMei);

  const hoje = new Date();
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [mes, setMes] = useState(String(hoje.getMonth() + 1).padStart(2, "0"));
  const [query, setQuery] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState<"Pendentes" | "Concluídas" | "Todas">("Pendentes");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Obligation | null>(null);

  const competencia = `${ano}-${mes}`;
  const hojeIso = hoje.toISOString().slice(0, 10);

  const rotinasDepto = useMemo(
    () => rotinasDepartamentosDoMes(clients, checklistFiscal, checklistContabil, checklistPessoal, checklistMei, competencia),
    [clients, checklistFiscal, checklistContabil, checklistPessoal, checklistMei, competencia]
  );

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

  function setStatusChecklist(setor: SetorRotina, clienteId: string, comp: string, rotina: string, status: ChecklistStatus) {
    if (setor === "Fiscal") setChecklistFiscal(clienteId, comp, rotina, status);
    else if (setor === "Contábil") setChecklistContabil(clienteId, comp, rotina, status);
    else if (setor === "Departamento Pessoal") setChecklistPessoal(clienteId, comp, rotina, status);
    else setChecklistMei(clienteId, comp, rotina, status);
  }

  const linhas = useMemo<Linha[]>(() => {
    const manuais: Linha[] = obligations
      .filter((o) => o.competencia === competencia)
      .map((o) => ({
        kind: "manual",
        id: o.id,
        clienteId: o.clienteId,
        tipo: o.tipo,
        setor: "Manual",
        vencimento: o.vencimento,
        responsavelId: o.responsavelId,
        status: o.status,
        pendente: PENDENTES_MANUAL.includes(o.status),
        obligation: o,
      }));
    const departamentos: Linha[] = rotinasDepto.map((r) => ({
      kind: "departamento",
      id: r.id,
      clienteId: r.clienteId,
      tipo: r.tipo,
      setor: r.setor,
      vencimento: null,
      responsavelId: null,
      status: r.status,
      pendente: PENDENTES_DEPTO.includes(r.status),
      rotina: r,
    }));
    return [...manuais, ...departamentos];
  }, [obligations, rotinasDepto, competencia]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return linhas
      .map((l) => ({ linha: l, cliente: clients.find((c) => c.id === l.clienteId) }))
      .filter(({ linha: l, cliente }) => {
        const nomeCliente = cliente?.dados.nomeFantasia ?? cliente?.dados.razaoSocial ?? "";
        const matchesQuery = q === "" || l.tipo.toLowerCase().includes(q) || nomeCliente.toLowerCase().includes(q);
        const matchesCliente = clienteFiltro === "Todos" || l.clienteId === clienteFiltro;
        const matchesStatus = statusFiltro === "Todas" ? true : statusFiltro === "Pendentes" ? l.pendente : !l.pendente;
        return matchesQuery && matchesCliente && matchesStatus;
      })
      .sort((a, b) => {
        const an = a.cliente?.dados.nomeFantasia ?? a.cliente?.dados.razaoSocial ?? "";
        const bn = b.cliente?.dados.nomeFantasia ?? b.cliente?.dados.razaoSocial ?? "";
        return an.localeCompare(bn, "pt-BR") || a.linha.tipo.localeCompare(b.linha.tipo, "pt-BR");
      });
  }, [linhas, clients, query, clienteFiltro, statusFiltro]);

  const totalPendentes = linhas.filter((l) => l.pendente).length;
  const totalAtrasadas = linhas.filter((l) => l.kind === "manual" && l.pendente && l.vencimento && l.vencimento < hojeIso).length;

  return (
    <div>
      <PageHeader
        title="Obrigações"
        description="Visão geral do que está pendente de cada cliente — junta as rotinas de Fiscal, Contábil, Departamento Pessoal e MEI com obrigações avulsas."
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
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MESES.map((m) => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os clientes</SelectItem>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.nomeFantasia ?? c.dados.razaoSocial}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as typeof statusFiltro)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Pendentes">Pendentes</SelectItem>
            <SelectItem value="Concluídas">Concluídas</SelectItem>
            <SelectItem value="Todas">Todos os status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Obrigação</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(({ linha: l, cliente }) => {
            const atrasada = l.kind === "manual" && l.vencimento !== null && l.vencimento < hojeIso && l.pendente;
            return (
              <TableRow key={l.id}>
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
                  <CalendarClock className="size-3.5 shrink-0 text-wine-500" /> {l.tipo}
                </TableCell>
                <TableCell><Badge variant={SETOR_STYLE[l.setor]}>{l.setor}</Badge></TableCell>
                <TableCell className={cn(atrasada && "font-semibold text-status-danger")}>
                  {l.vencimento ? formatDate(l.vencimento) : "—"}
                </TableCell>
                <TableCell>{l.responsavelId ? teamName(l.responsavelId) : "—"}</TableCell>
                <TableCell>
                  {l.kind === "manual" ? (
                    <Select value={l.status} onValueChange={(v) => updateObligation(l.id, { status: v as Obligation["status"] })}>
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OBLIGATION_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={l.status}
                      onValueChange={(v) => setStatusChecklist(l.setor, l.clienteId, competencia, l.tipo, v as ChecklistStatus)}
                    >
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHECKLIST_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {l.kind === "manual" && (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(l.obligation)}
                        className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => excluir(l.obligation)}
                        className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
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
