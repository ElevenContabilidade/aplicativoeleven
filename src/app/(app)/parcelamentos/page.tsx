"use client";

import { useMemo, useState } from "react";
import { Receipt, Plus, Send, Clock, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ParcelamentoFormDialog } from "@/components/parcelamentos/parcelamento-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatDate } from "@/lib/utils";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

export default function ParcelamentosPage() {
  const parcelamentos = useAppStore((s) => s.parcelamentos);
  const updateParcelamento = useAppStore((s) => s.updateParcelamento);
  const deleteParcelamento = useAppStore((s) => s.deleteParcelamento);

  const [formOpen, setFormOpen] = useState(false);

  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>("anual");

  const filteredAno = useMemo(
    () => parcelamentos.filter((p) => p.competencia.startsWith(year)),
    [parcelamentos, year]
  );

  const filtered = useMemo(
    () => filteredAno.filter((p) => mes === "anual" || p.competencia === `${year}-${mes}`),
    [filteredAno, mes, year]
  );

  const enviados = filteredAno.filter((p) => p.status === "Enviado").length;
  const naoEnviados = filteredAno.filter((p) => p.status === "Não enviado").length;

  function toggleStatus(p: (typeof parcelamentos)[number]) {
    updateParcelamento(p.id, { status: p.status === "Enviado" ? "Não enviado" : "Enviado" });
  }

  function handleDelete(e: React.MouseEvent, id: string, clienteNome: string) {
    e.stopPropagation();
    if (confirm(`Excluir o parcelamento de ${clienteNome}?`)) deleteParcelamento(id);
  }

  return (
    <div>
      <PageHeader
        title="Parcelamentos"
        description="Controle de parcelamentos por cliente, tipo e envio."
        actions={<Button size="sm" onClick={() => setFormOpen(true)}><Plus className="size-3.5" /> Novo parcelamento</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Parcelamentos no período" value={filteredAno.length} icon={Receipt} tone="wine" />
        <MetricCard label="Enviados" value={enviados} icon={Send} tone="success" />
        <MetricCard label="Não enviados" value={naoEnviados} icon={Clock} tone="warning" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-sand-500">Clique no status da tabela para marcar como enviado ou não enviado.</p>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <PeriodChip label="Anual" active={mes === "anual"} onClick={() => setMes("anual")} />
        {MESES.map((m) => (
          <PeriodChip key={m.value} label={m.label} active={mes === m.value} onClick={() => setMes(m.value)} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Parcelamentos de {mes === "anual" ? year : `${MESES.find((m) => m.value === mes)?.label}/${year}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de parcelamento</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.clienteNome}</TableCell>
                  <TableCell>{p.tipo}</TableCell>
                  <TableCell className="text-sand-500">{p.competencia}</TableCell>
                  <TableCell className="text-sand-500">{formatDate(p.criadoEm)}</TableCell>
                  <TableCell>
                    <button type="button" onClick={() => toggleStatus(p)} title="Alternar status de envio">
                      <StatusBadge status={p.status} className="cursor-pointer" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, p.id, p.clienteNome)}
                      title="Excluir parcelamento"
                      className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-sand-400">Nenhum parcelamento neste período.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ParcelamentoFormDialog open={formOpen} onOpenChange={setFormOpen} />
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
