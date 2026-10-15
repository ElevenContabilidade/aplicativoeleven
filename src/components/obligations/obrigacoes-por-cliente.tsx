"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { rotinasDepartamentosDoMes, type SetorRotina } from "@/lib/obrigacoes-departamentos";
import type { ChecklistStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PENDENTES_DEPTO: ChecklistStatus[] = ["Pendente", "Em andamento"];
const SETORES: SetorRotina[] = ["Fiscal", "Contábil", "Departamento Pessoal", "MEI"];

const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];
const YEARS = Array.from({ length: 2034 - 2024 + 1 }, (_, i) => String(2024 + i)).reverse();

function pctColor(pct: number | null) {
  if (pct === null) return "text-sand-300";
  if (pct === 100) return "text-status-success";
  if (pct === 0) return "text-status-danger";
  return "text-status-warning";
}

/** Uma linha por cliente, com o % de conclusão em cada setor naquela
 * competência — cruza os 4 checklists de departamento num lugar só, ao
 * invés de ter que abrir Fiscal/Contábil/Pessoal/MEI em separado pra ver
 * como um cliente específico está indo. */
export function ObrigacoesPorCliente() {
  const clients = useAppStore((s) => s.clients);
  const checklistFiscal = useAppStore((s) => s.checklistFiscal);
  const checklistContabil = useAppStore((s) => s.checklistContabil);
  const checklistPessoal = useAppStore((s) => s.checklistPessoal);
  const checklistMei = useAppStore((s) => s.checklistMei);
  const dispensasRotina = useAppStore((s) => s.dispensasRotina);
  const regrasVencimentoOverride = useAppStore((s) => s.regrasVencimentoOverride);
  const rotinasDesativadas = useAppStore((s) => s.rotinasDesativadas);

  const hoje = new Date();
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [mes, setMes] = useState(String(hoje.getMonth() + 1).padStart(2, "0"));
  const [query, setQuery] = useState("");

  const competencia = `${ano}-${mes}`;

  const rotinas = useMemo(
    () =>
      rotinasDepartamentosDoMes(
        clients,
        checklistFiscal,
        checklistContabil,
        checklistPessoal,
        checklistMei,
        competencia,
        dispensasRotina,
        regrasVencimentoOverride,
        rotinasDesativadas
      ),
    [clients, checklistFiscal, checklistContabil, checklistPessoal, checklistMei, competencia, dispensasRotina, regrasVencimentoOverride, rotinasDesativadas]
  );

  const linhas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((c) => (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding") && c.dados.razaoSocial.toLowerCase().includes(q))
      .map((c) => {
        const doCliente = rotinas.filter((r) => r.clienteId === c.id);
        const porSetor = SETORES.map((setor) => {
          const doSetor = doCliente.filter((r) => r.setor === setor);
          if (doSetor.length === 0) return { setor, pct: null as number | null, total: 0, concluidas: 0 };
          const concluidas = doSetor.filter((r) => !PENDENTES_DEPTO.includes(r.status)).length;
          return { setor, pct: Math.round((concluidas / doSetor.length) * 100), total: doSetor.length, concluidas };
        });
        const total = doCliente.length;
        const concluidas = doCliente.filter((r) => !PENDENTES_DEPTO.includes(r.status)).length;
        const pctGeral = total > 0 ? Math.round((concluidas / total) * 100) : null;
        return { cliente: c, porSetor, total, concluidas, pctGeral };
      })
      .filter((l) => l.total > 0)
      .sort((a, b) => (a.pctGeral ?? 101) - (b.pctGeral ?? 101) || a.cliente.dados.razaoSocial.localeCompare(b.cliente.dados.razaoSocial, "pt-BR"));
  }, [clients, rotinas, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente" className="pl-8" />
        </div>
        <Select value={mes} onValueChange={setMes}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
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
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            {SETORES.map((s) => (<TableHead key={s} className="text-center">{s}</TableHead>))}
            <TableHead className="text-center">Geral</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l) => (
            <TableRow key={l.cliente.id}>
              <TableCell>
                <Link href={`/clientes/${l.cliente.id}`} className="font-medium text-sand-900 hover:text-wine-700 hover:underline">
                  {l.cliente.dados.razaoSocial}
                </Link>
              </TableCell>
              {l.porSetor.map((s) => (
                <TableCell key={s.setor} className={cn("text-center font-semibold", pctColor(s.pct))}>
                  {s.pct === null ? "—" : `${s.pct}%`}
                </TableCell>
              ))}
              <TableCell className={cn("text-center font-semibold", pctColor(l.pctGeral))}>
                {l.pctGeral === null ? "—" : `${l.pctGeral}%`}
              </TableCell>
            </TableRow>
          ))}
          {linhas.length === 0 && (
            <TableRow><TableCell colSpan={SETORES.length + 2} className="py-10 text-center text-sand-400">Nenhum cliente encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
