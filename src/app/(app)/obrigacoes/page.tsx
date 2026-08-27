"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/data/seed";
import type { ObligationStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const STATUSES: ObligationStatus[] = ["A fazer", "Em andamento", "Concluído", "Não aplicável", "Aguardando informação", "Em atraso"];

export default function ObrigacoesPage() {
  const obligations = useAppStore((s) => s.obligations);
  const clients = useAppStore((s) => s.clients);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");

  const tipos = ["Todos", ...Array.from(new Set(obligations.map((o) => o.tipo)))];

  const filtered = useMemo(() => {
    return obligations
      .filter((o) => {
        const client = clients.find((c) => c.id === o.clienteId);
        const q = query.trim().toLowerCase();
        const matchesQuery = q === "" || o.tipo.toLowerCase().includes(q) || (client?.dados.razaoSocial ?? "").toLowerCase().includes(q);
        const matchesStatus = status === "Todos" || o.status === status;
        const matchesTipo = tipo === "Todos" || o.tipo === tipo;
        return matchesQuery && matchesStatus && matchesTipo;
      })
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }, [obligations, clients, query, status, tipo]);

  return (
    <div>
      <PageHeader title="Obrigações" description="Controle de obrigações fiscais, trabalhistas e acessórias por cliente e competência." />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input placeholder="Buscar obrigação ou cliente" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={tipo} onValueChange={setTipo}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {tipos.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            {STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Obrigação</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Competência</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Protocolo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((o) => {
            const client = clients.find((c) => c.id === o.clienteId);
            const overdue = o.status === "Em atraso";
            return (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.tipo}</TableCell>
                <TableCell>{client?.dados.nomeFantasia ?? client?.dados.razaoSocial ?? "—"}</TableCell>
                <TableCell>{o.competencia}</TableCell>
                <TableCell>{teamName(o.responsavelId)}</TableCell>
                <TableCell className={cn(overdue && "font-semibold text-status-danger")}>{formatDate(o.vencimento)}</TableCell>
                <TableCell className="text-sand-500">{o.protocolo ?? "—"}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhuma obrigação encontrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
