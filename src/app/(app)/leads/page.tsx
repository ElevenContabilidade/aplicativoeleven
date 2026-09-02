"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { LeadDetailDialog } from "@/components/crm/lead-detail-dialog";
import { LeadFormDialog } from "@/components/crm/lead-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { LEAD_STAGES, type Lead } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function LeadsPage() {
  const leads = useAppStore((s) => s.leads);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<string>("Todos");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = q === "" || l.nome.toLowerCase().includes(q) || (l.empresa ?? "").toLowerCase().includes(q);
      const matchesStage = stage === "Todos" || l.stage === stage;
      return matchesQuery && matchesStage;
    });
  }, [leads, query, stage]);

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`${leads.length} leads cadastrados no funil comercial.`}
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Novo lead</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input placeholder="Buscar lead ou empresa" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todas as etapas</SelectItem>
            {LEAD_STAGES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Valor estimado</TableHead>
            <TableHead>Últ. contato</TableHead>
            <TableHead>Etapa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((l) => (
            <TableRow key={l.id} className="cursor-pointer" onClick={() => setSelected(l)}>
              <TableCell>
                <span className="block font-medium text-sand-900">{l.nome}</span>
                <span className="block text-[11px] text-sand-400">{l.empresa}</span>
              </TableCell>
              <TableCell>{l.origem}</TableCell>
              <TableCell>{teamName(l.responsavelId)}</TableCell>
              <TableCell>{formatCurrency(l.valorEstimado)}</TableCell>
              <TableCell>{formatDate(l.dataUltimoContato)}</TableCell>
              <TableCell><StatusBadge status={l.stage} /></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-sand-400">Nenhum lead encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <LeadDetailDialog key={selected?.id ?? "none"} lead={selected} onClose={() => setSelected(null)} />
      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
