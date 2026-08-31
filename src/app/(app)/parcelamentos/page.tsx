"use client";

import { useMemo, useState } from "react";
import { Receipt, Plus, Send, Clock, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ParcelamentoFormDialog } from "@/components/parcelamentos/parcelamento-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import type { Parcelamento } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

type SortColumn = "clienteNome" | "nome" | "tipo" | "cnpj" | "dataInicio" | "quantidadeParcelas" | "status";

function SortableHead({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  sort: { column: SortColumn; direction: "asc" | "desc" } | null;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const active = sort?.column === column;
  const Icon = active ? (sort!.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn("flex items-center gap-1 uppercase tracking-wide hover:text-wine-700", active && "text-wine-700")}
      >
        {label}
        <Icon className={cn("size-3", !active && "text-sand-300")} />
      </button>
    </TableHead>
  );
}

export default function ParcelamentosPage() {
  const parcelamentos = useAppStore((s) => s.parcelamentos);
  const updateParcelamento = useAppStore((s) => s.updateParcelamento);
  const deleteParcelamento = useAppStore((s) => s.deleteParcelamento);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Parcelamento | null>(null);
  const [formSession, setFormSession] = useState(0);
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" } | null>(null);

  const [year, setYear] = useState(() => {
    const current = new Date().getFullYear().toString();
    return YEARS.includes(current) ? current : YEARS[0];
  });
  const [mes, setMes] = useState<string>("anual");

  function openCreate() {
    setEditing(null);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  }

  function openEdit(p: Parcelamento) {
    setEditing(p);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  }

  function toggleSort(column: SortColumn) {
    setSort((s) => (s?.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }));
  }

  const filteredAno = useMemo(
    () => parcelamentos.filter((p) => p.dataInicio.startsWith(year)),
    [parcelamentos, year]
  );

  const filtered = useMemo(
    () => filteredAno.filter((p) => mes === "anual" || p.dataInicio.startsWith(`${year}-${mes}`)),
    [filteredAno, mes, year]
  );

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const { column } = sort;
      if (column === "quantidadeParcelas") return ((a.quantidadeParcelas ?? 0) - (b.quantidadeParcelas ?? 0)) * dir;
      const av = (a[column] ?? "") as string;
      const bv = (b[column] ?? "") as string;
      return av.localeCompare(bv, "pt-BR") * dir;
    });
  }, [filtered, sort]);

  const enviados = filteredAno.filter((p) => p.status === "Enviado").length;
  const naoEnviados = filteredAno.filter((p) => p.status === "Não enviado").length;

  function toggleStatus(e: React.MouseEvent, p: Parcelamento) {
    e.stopPropagation();
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
        actions={<Button size="sm" onClick={openCreate}><Plus className="size-3.5" /> Novo parcelamento</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Parcelamentos no período" value={filteredAno.length} icon={Receipt} tone="wine" />
        <MetricCard label="Enviados" value={enviados} icon={Send} tone="success" />
        <MetricCard label="Não enviados" value={naoEnviados} icon={Clock} tone="warning" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-sand-500">Clique em uma linha para editar. Clique no status para marcar como enviado ou não enviado.</p>
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
                <SortableHead label="Cliente" column="clienteNome" sort={sort} onSort={toggleSort} />
                <SortableHead label="CNPJ" column="cnpj" sort={sort} onSort={toggleSort} />
                <SortableHead label="Nome do parcelamento" column="nome" sort={sort} onSort={toggleSort} />
                <SortableHead label="Tipo" column="tipo" sort={sort} onSort={toggleSort} />
                <SortableHead label="Início" column="dataInicio" sort={sort} onSort={toggleSort} />
                <SortableHead label="Parcelas" column="quantidadeParcelas" sort={sort} onSort={toggleSort} className="w-20" />
                <SortableHead label="Status" column="status" sort={sort} onSort={toggleSort} />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => openEdit(p)}>
                  <TableCell className="font-medium">{p.clienteNome}</TableCell>
                  <TableCell className="text-sand-500">{p.cnpj || "—"}</TableCell>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell>{p.tipo}</TableCell>
                  <TableCell className="text-sand-500">{formatDate(p.dataInicio)}</TableCell>
                  <TableCell className="text-sand-500">{p.quantidadeParcelas ? `${p.quantidadeParcelas}x` : "—"}</TableCell>
                  <TableCell>
                    <button type="button" onClick={(e) => toggleStatus(e, p)} title="Alternar status de envio">
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
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-sand-400">Nenhum parcelamento neste período.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ParcelamentoFormDialog
        key={`parcelamento-${editing?.id ?? "new"}-${formSession}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        parcelamento={editing ?? undefined}
      />
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
