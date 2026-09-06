"use client";

import { useMemo, useState } from "react";
import { ShieldAlert, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { formatDateTime } from "@/lib/utils";

const TODOS = "Todos";

export default function AuditoriaPage() {
  const auditLog = useAppStore((s) => s.auditLog);
  const [busca, setBusca] = useState("");
  const [autorFiltro, setAutorFiltro] = useState(TODOS);
  const [moduloFiltro, setModuloFiltro] = useState(TODOS);

  const autores = useMemo(() => [...new Set(auditLog.map((e) => e.autor))].sort((a, b) => a.localeCompare(b, "pt-BR")), [auditLog]);
  const modulos = useMemo(() => [...new Set(auditLog.map((e) => e.modulo))].sort((a, b) => a.localeCompare(b, "pt-BR")), [auditLog]);

  const ordenados = useMemo(() => [...auditLog].sort((a, b) => b.data.localeCompare(a.data)), [auditLog]);

  const linhas = useMemo(() => {
    return ordenados.filter((e) => {
      if (autorFiltro !== TODOS && e.autor !== autorFiltro) return false;
      if (moduloFiltro !== TODOS && e.modulo !== moduloFiltro) return false;
      if (!busca.trim()) return true;
      const termo = busca.trim().toLowerCase();
      return e.acao.toLowerCase().includes(termo) || (e.detalhe ?? "").toLowerCase().includes(termo);
    });
  }, [ordenados, autorFiltro, moduloFiltro, busca]);

  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const seteDiasAtras = useMemo(() => new Date(new Date().getTime() - 7 * 86_400_000).toISOString(), []);
  const eventosHoje = auditLog.filter((e) => e.data.slice(0, 10) === hoje).length;
  const eventosSemana = auditLog.filter((e) => e.data >= seteDiasAtras).length;

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description="Quem fez o quê no sistema — cobre exclusões e as ações de maior risco (ciclo de vida de cliente/colaborador, honorário, permissões)."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Eventos registrados" value={auditLog.length} icon={ShieldAlert} tone="wine" />
        <MetricCard label="Hoje" value={eventosHoje} icon={ShieldAlert} tone="neutral" />
        <MetricCard label="Últimos 7 dias" value={eventosSemana} icon={ShieldAlert} tone="neutral" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar ação ou detalhe" className="pl-8" />
        </div>
        <Select value={autorFiltro} onValueChange={setAutorFiltro}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os colaboradores</SelectItem>
            {autores.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={moduloFiltro} onValueChange={setModuloFiltro}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os módulos</SelectItem>
            {modulos.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos ({linhas.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Quando</TableHead>
                <TableHead className="w-40">Quem</TableHead>
                <TableHead className="w-36">Módulo</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-sand-500">{formatDateTime(e.data)}</TableCell>
                  <TableCell className="font-medium">{e.autor}</TableCell>
                  <TableCell>{e.modulo}</TableCell>
                  <TableCell>
                    {e.acao}
                    {e.detalhe && <span className="block text-[11px] text-sand-400">{e.detalhe}</span>}
                  </TableCell>
                </TableRow>
              ))}
              {linhas.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-sand-400">Nenhum evento registrado ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
