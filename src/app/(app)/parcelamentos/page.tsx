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
import type { Parcelamento, StatusEnvioParcelamento } from "@/lib/types";
import { competenciasDoPlano } from "@/lib/parcelamento";
import { cn } from "@/lib/utils";

const YEARS = Array.from({ length: 2034 - 2026 + 1 }, (_, i) => String(2026 + i));
const MESES = [
  { value: "01", label: "Jan" }, { value: "02", label: "Fev" }, { value: "03", label: "Mar" },
  { value: "04", label: "Abr" }, { value: "05", label: "Mai" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Ago" }, { value: "09", label: "Set" },
  { value: "10", label: "Out" }, { value: "11", label: "Nov" }, { value: "12", label: "Dez" },
];

interface Ocorrencia {
  parcelamento: Parcelamento;
  competencia: string;
  parcelaAtual: number;
  totalParcelas: number;
  status: StatusEnvioParcelamento;
}

type SortColumn = "clienteNome" | "cnpjCpf" | "nome" | "competencia" | "parcelaAtual" | "status";

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
  const enviosParcelamento = useAppStore((s) => s.enviosParcelamento);
  const deleteParcelamento = useAppStore((s) => s.deleteParcelamento);
  const setEnvioParcelamento = useAppStore((s) => s.setEnvioParcelamento);

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

  const ocorrencias = useMemo(() => {
    const statusMap = new Map(enviosParcelamento.map((e) => [`${e.parcelamentoId}__${e.competencia}`, e.status]));
    const list: Ocorrencia[] = [];
    for (const p of parcelamentos) {
      const competencias = competenciasDoPlano(p);
      competencias.forEach((competencia, i) => {
        list.push({
          parcelamento: p,
          competencia,
          parcelaAtual: i + 1,
          totalParcelas: competencias.length,
          status: statusMap.get(`${p.id}__${competencia}`) ?? "Não enviado",
        });
      });
    }
    return list;
  }, [parcelamentos, enviosParcelamento]);

  const filteredAno = useMemo(
    () => ocorrencias.filter((o) => o.competencia.startsWith(year)),
    [ocorrencias, year]
  );

  const filtered = useMemo(
    () => filteredAno.filter((o) => mes === "anual" || o.competencia === `${year}-${mes}`),
    [filteredAno, mes, year]
  );

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const dir = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const { column } = sort;
      if (column === "parcelaAtual") return (a.parcelaAtual - b.parcelaAtual) * dir;
      if (column === "competencia" || column === "status") return a[column].localeCompare(b[column], "pt-BR") * dir;
      const av = (a.parcelamento[column] ?? "") as string;
      const bv = (b.parcelamento[column] ?? "") as string;
      return av.localeCompare(bv, "pt-BR") * dir;
    });
  }, [filtered, sort]);

  // O dashboard acompanha o período selecionado: com "Anual" soma o ano inteiro
  // (filtered === filteredAno), com um mês específico mostra só aquele mês.
  const enviados = filtered.filter((o) => o.status === "Enviado").length;
  const naoEnviados = filtered.filter((o) => o.status === "Não enviado").length;

  function toggleStatus(e: React.MouseEvent, o: Ocorrencia) {
    e.stopPropagation();
    setEnvioParcelamento(o.parcelamento.id, o.competencia, o.status === "Enviado" ? "Não enviado" : "Enviado");
  }

  function handleDelete(e: React.MouseEvent, p: Parcelamento) {
    e.stopPropagation();
    if (confirm(`Excluir o parcelamento "${p.nome}" de ${p.clienteNome}? Isso remove todas as parcelas, passadas e futuras.`)) {
      deleteParcelamento(p.id);
    }
  }

  return (
    <div>
      <PageHeader
        title="Parcelamentos"
        description="Controle de parcelamentos por cliente e envio mensal, enquanto durarem as parcelas."
        actions={<Button size="sm" onClick={openCreate}><Plus className="size-3.5" /> Novo parcelamento</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Parcelas no período" value={filtered.length} icon={Receipt} tone="wine" />
        <MetricCard label="Enviados" value={enviados} icon={Send} tone="success" />
        <MetricCard label="Não enviados" value={naoEnviados} icon={Clock} tone="warning" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-sand-500">Clique em uma linha para editar o parcelamento. Clique no status para marcar aquele mês como enviado ou não.</p>
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
                <SortableHead label="CNPJ/CPF" column="cnpjCpf" sort={sort} onSort={toggleSort} />
                <SortableHead label="Nome do parcelamento" column="nome" sort={sort} onSort={toggleSort} />
                <SortableHead label="Parcela" column="parcelaAtual" sort={sort} onSort={toggleSort} className="w-20" />
                <SortableHead label="Competência" column="competencia" sort={sort} onSort={toggleSort} />
                <SortableHead label="Status" column="status" sort={sort} onSort={toggleSort} />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((o) => (
                <TableRow
                  key={`${o.parcelamento.id}-${o.competencia}`}
                  className="cursor-pointer"
                  onClick={() => openEdit(o.parcelamento)}
                >
                  <TableCell className="font-medium">{o.parcelamento.clienteNome}</TableCell>
                  <TableCell className="text-sand-500">{o.parcelamento.cnpjCpf || "—"}</TableCell>
                  <TableCell>{o.parcelamento.nome}</TableCell>
                  <TableCell className="text-sand-500">{o.parcelaAtual}/{o.totalParcelas}</TableCell>
                  <TableCell className="text-sand-500">{o.competencia}</TableCell>
                  <TableCell>
                    <button type="button" onClick={(e) => toggleStatus(e, o)} title="Alternar status de envio deste mês">
                      <StatusBadge status={o.status} className="cursor-pointer" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, o.parcelamento)}
                      title="Excluir parcelamento"
                      className="rounded-md p-1.5 text-sand-400 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhum parcelamento neste período.</TableCell></TableRow>
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
