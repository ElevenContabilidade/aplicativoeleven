"use client";

import { useCallback, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { rotinasDepartamentosDoMes, type SetorRotina } from "@/lib/obrigacoes-departamentos";
import type { Obligation, ChecklistStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const WINE = "#5C1420";

const PENDENTES_MANUAL: Obligation["status"][] = ["A fazer", "Em andamento", "Aguardando informação", "Em atraso"];
const PENDENTES_DEPTO: ChecklistStatus[] = ["Pendente", "Em andamento"];
const SETORES: (SetorRotina | "Manual")[] = ["Fiscal", "Contábil", "Departamento Pessoal", "MEI", "Manual"];

const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];
const YEARS = Array.from({ length: 2034 - 2024 + 1 }, (_, i) => String(2024 + i)).reverse();

function pctColor(pct: number) {
  if (pct === 100) return "text-status-success";
  if (pct === 0) return "text-status-danger";
  return "text-status-warning";
}

/** Desempenho por setor/colaborador no mês selecionado, e tendência de
 * conclusão mês a mês no ano selecionado — junta rotinas de departamento
 * (Fiscal/Contábil/Pessoal/MEI, sem responsável individual) com obrigações
 * avulsas (que têm responsável, então entram na comparação por
 * colaborador). */
export function ObrigacoesRelatorios() {
  const clients = useAppStore((s) => s.clients);
  const obligations = useAppStore((s) => s.obligations);
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
  const competencia = `${ano}-${mes}`;

  const rotinasDoMes = useCallback(
    (comp: string) =>
      rotinasDepartamentosDoMes(
        clients,
        checklistFiscal,
        checklistContabil,
        checklistPessoal,
        checklistMei,
        comp,
        dispensasRotina,
        regrasVencimentoOverride,
        rotinasDesativadas
      ),
    [clients, checklistFiscal, checklistContabil, checklistPessoal, checklistMei, dispensasRotina, regrasVencimentoOverride, rotinasDesativadas]
  );

  const rotinasMes = useMemo(() => rotinasDoMes(competencia), [competencia, rotinasDoMes]);
  const manuaisMes = useMemo(() => obligations.filter((o) => o.competencia === competencia), [obligations, competencia]);

  const porSetor = useMemo(() => {
    return SETORES.map((setor) => {
      if (setor === "Manual") {
        const total = manuaisMes.length;
        const concluidas = manuaisMes.filter((o) => !PENDENTES_MANUAL.includes(o.status)).length;
        return { setor, total, concluidas, pct: total > 0 ? Math.round((concluidas / total) * 100) : 0 };
      }
      const doSetor = rotinasMes.filter((r) => r.setor === setor);
      const concluidas = doSetor.filter((r) => !PENDENTES_DEPTO.includes(r.status)).length;
      return { setor, total: doSetor.length, concluidas, pct: doSetor.length > 0 ? Math.round((concluidas / doSetor.length) * 100) : 0 };
    }).filter((s) => s.total > 0);
  }, [rotinasMes, manuaisMes]);

  const porColaborador = useMemo(() => {
    const map = new Map<string, { responsavelId: string; total: number; concluidas: number; atrasadas: number }>();
    const hojeIso = new Date().toISOString().slice(0, 10);
    for (const o of manuaisMes) {
      const atual = map.get(o.responsavelId) ?? { responsavelId: o.responsavelId, total: 0, concluidas: 0, atrasadas: 0 };
      atual.total += 1;
      const pendente = PENDENTES_MANUAL.includes(o.status);
      if (!pendente) atual.concluidas += 1;
      else if (o.vencimento < hojeIso) atual.atrasadas += 1;
      map.set(o.responsavelId, atual);
    }
    return [...map.values()]
      .map((c) => ({ ...c, pct: c.total > 0 ? Math.round((c.concluidas / c.total) * 100) : 0 }))
      .sort((a, b) => a.pct - b.pct);
  }, [manuaisMes]);

  const tendencia = useMemo(() => {
    return MESES.map((m) => {
      const comp = `${ano}-${m.value}`;
      const rotinasDoMesIter = rotinasDoMes(comp);
      const manuaisDoMes = obligations.filter((o) => o.competencia === comp);
      const total = rotinasDoMesIter.length + manuaisDoMes.length;
      const concluidas =
        rotinasDoMesIter.filter((r) => !PENDENTES_DEPTO.includes(r.status)).length +
        manuaisDoMes.filter((o) => !PENDENTES_MANUAL.includes(o.status)).length;
      return { mes: m.label, pct: total > 0 ? Math.round((concluidas / total) * 100) : 0 };
    });
  }, [ano, rotinasDoMes, obligations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
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

      <Card>
        <CardHeader><CardTitle>Desempenho por setor — {MESES.find((m) => m.value === mes)?.label}/{ano}</CardTitle></CardHeader>
        <CardContent className="pt-4">
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <BarChart data={porSetor}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                <XAxis dataKey="setor" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="pct" fill={WINE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Desempenho por colaborador (obrigações avulsas) — {MESES.find((m) => m.value === mes)?.label}/{ano}</CardTitle></CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Concluídas</TableHead>
                <TableHead className="text-center">Atrasadas</TableHead>
                <TableHead className="text-center">% concluído</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {porColaborador.map((c) => (
                <TableRow key={c.responsavelId}>
                  <TableCell className="font-medium">{teamName(c.responsavelId)}</TableCell>
                  <TableCell className="text-center">{c.total}</TableCell>
                  <TableCell className="text-center text-status-success">{c.concluidas}</TableCell>
                  <TableCell className="text-center text-status-danger">{c.atrasadas}</TableCell>
                  <TableCell className={cn("text-center font-semibold", pctColor(c.pct))}>{c.pct}%</TableCell>
                </TableRow>
              ))}
              {porColaborador.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-sand-400">Nenhuma obrigação avulsa nesse mês.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Tendência de conclusão — {ano}</CardTitle></CardHeader>
        <CardContent className="pt-4">
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <LineChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="pct" stroke={WINE} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
