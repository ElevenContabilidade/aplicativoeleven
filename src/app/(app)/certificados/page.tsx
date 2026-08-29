"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldAlert, ShieldCheck, ShieldX, Clock, Plus, Eye, EyeOff, Pencil, Download, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { CertificadoFormDialog } from "@/components/certificates/certificado-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Certificado } from "@/lib/types";

function daysUntil(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function expiryBadge(days: number) {
  if (days < 0) return <Badge variant="danger">Vencido</Badge>;
  if (days <= 7) return <Badge variant="danger">Vence em {days}d</Badge>;
  if (days <= 15) return <Badge variant="warning">Vence em {days}d</Badge>;
  if (days <= 30) return <Badge variant="warning">Vence em {days}d</Badge>;
  if (days <= 60) return <Badge variant="cream">Vence em {days}d</Badge>;
  return <Badge variant="outline">Vence em {days}d</Badge>;
}

type SortColumn = "cliente" | "vencimento" | "alerta" | "status";

// Ascending = most urgent first, so Vencimento/Alerta/Status all read the same direction.
const STATUS_URGENCY: Record<string, number> = { Vencido: 0, "Aguardando Renovação": 1, Válido: 2 };

function SortableHead({
  label,
  column,
  sort,
  onSort,
}: {
  label: string;
  column: SortColumn;
  sort: { column: SortColumn; direction: "asc" | "desc" };
  onSort: (column: SortColumn) => void;
}) {
  const active = sort.column === column;
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "flex items-center gap-1 uppercase tracking-wide hover:text-wine-700",
          active && "text-wine-700"
        )}
      >
        {label}
        <Icon className={cn("size-3", !active && "text-sand-300")} />
      </button>
    </TableHead>
  );
}

export default function CertificadosPage() {
  const certificados = useAppStore((s) => s.certificados);
  const clients = useAppStore((s) => s.clients);
  const documentos = useAppStore((s) => s.documentos);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" }>({
    column: "vencimento",
    direction: "asc",
  });
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Certificado | null>(null);
  // Bumped on every dialog open so CertificadoFormDialog always remounts fresh
  // (via the `key` below) instead of carrying over a previous, possibly-edited draft.
  const [formSession, setFormSession] = useState(0);

  const searchParams = useSearchParams();
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(() => searchParams.get("novo") === "1");

  function openCreate() {
    setEditing(null);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  }

  function openEdit(c: Certificado) {
    setEditing(c);
    setFormSession((n) => n + 1);
    setFormOpen(true);
  }

  function toggleSort(column: SortColumn) {
    setSort((s) => (s.column === column ? { column, direction: s.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }));
  }

  function toggleRevealed(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (searchParams.get("novo") === "1") router.replace("/certificados");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return certificados
      .filter((c) => {
        if (!q) return true;
        const client = clients.find((cl) => cl.id === c.clienteId);
        const days = daysUntil(c.dataVencimento);
        const haystack = [
          client?.dados.nomeFantasia,
          client?.dados.razaoSocial,
          c.tipo,
          c.documento,
          formatDate(c.dataVencimento),
          days < 0 ? "vencido" : `vence em ${days}d`,
          formatCurrency(c.valor),
          c.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sort.column === "cliente") {
          const clientA = clients.find((cl) => cl.id === a.clienteId);
          const clientB = clients.find((cl) => cl.id === b.clienteId);
          const nameA = clientA?.dados.nomeFantasia ?? clientA?.dados.razaoSocial ?? "";
          const nameB = clientB?.dados.nomeFantasia ?? clientB?.dados.razaoSocial ?? "";
          cmp = nameA.localeCompare(nameB);
        } else if (sort.column === "vencimento" || sort.column === "alerta") {
          cmp = a.dataVencimento.localeCompare(b.dataVencimento);
        } else if (sort.column === "status") {
          cmp = (STATUS_URGENCY[a.status] ?? 99) - (STATUS_URGENCY[b.status] ?? 99);
        }
        return sort.direction === "asc" ? cmp : -cmp;
      });
  }, [certificados, clients, query, sort]);

  const vencendo60 = certificados.filter((c) => { const d = daysUntil(c.dataVencimento); return d >= 0 && d <= 60; }).length;
  const vencendo30 = certificados.filter((c) => { const d = daysUntil(c.dataVencimento); return d >= 0 && d <= 30; }).length;
  const vencidos = certificados.filter((c) => daysUntil(c.dataVencimento) < 0).length;
  const emDia = certificados.filter((c) => daysUntil(c.dataVencimento) > 60).length;

  return (
    <div>
      <PageHeader
        title="Certificados digitais"
        description="Gestão de e-CPF e e-CNPJ da carteira, com alertas de vencimento."
        actions={<Button onClick={openCreate}><Plus className="size-3.5" /> Novo certificado</Button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Em dia" value={emDia} icon={ShieldCheck} tone="success" />
        <MetricCard label="Vencendo em 60d" value={vencendo60} icon={Clock} tone="wine" />
        <MetricCard label="Vencendo em 30d" value={vencendo30} icon={ShieldAlert} tone="warning" />
        <MetricCard label="Vencidos" value={vencidos} icon={ShieldX} tone="danger" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input
            placeholder="Buscar por cliente, tipo, CNPJ, vencimento, status..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-sand-500">Senha Certificado A1</span>
          <Button variant="outline" size="sm" onClick={() => setRevealedIds(new Set(filtered.map((c) => c.id)))}>
            Exibir Todas
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRevealedIds(new Set())}>
            Ocultar Todas
          </Button>
        </div>
      </div>

      <TooltipProvider delayDuration={200}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Cliente" column="cliente" sort={sort} onSort={toggleSort} />
              <TableHead>Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <SortableHead label="Vencimento" column="vencimento" sort={sort} onSort={toggleSort} />
              <SortableHead label="Alerta" column="alerta" sort={sort} onSort={toggleSort} />
              <TableHead>Valor</TableHead>
              <SortableHead label="Status" column="status" sort={sort} onSort={toggleSort} />
              <TableHead>Senha</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const client = clients.find((cl) => cl.id === c.clienteId);
              const days = daysUntil(c.dataVencimento);
              const revealed = revealedIds.has(c.id);
              const arquivo = documentos.find((d) => d.id === c.documentoId);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{client?.dados.nomeFantasia ?? client?.dados.razaoSocial}</TableCell>
                  <TableCell>{c.tipo}</TableCell>
                  <TableCell className="text-sand-500">{c.documento}</TableCell>
                  <TableCell>{formatDate(c.dataVencimento)}</TableCell>
                  <TableCell>{expiryBadge(days)}</TableCell>
                  <TableCell>{formatCurrency(c.valor)}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell>
                    {c.senha ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-sand-600">{revealed ? c.senha : "••••••"}</span>
                        <button
                          type="button"
                          onClick={() => toggleRevealed(c.id)}
                          title={revealed ? "Ocultar a senha" : "Exibir a senha"}
                          className="flex size-6 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                        >
                          {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-sand-300">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Editar Certificado Digital</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {arquivo?.url ? (
                            <a
                              href={arquivo.url}
                              download={arquivo.nome}
                              className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                            >
                              <Download className="size-3.5" />
                            </a>
                          ) : (
                            <span className="flex size-7 items-center justify-center text-sand-200">
                              <Download className="size-3.5" />
                            </span>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {arquivo?.url ? `Download do certificado ${c.tipo.includes("A3") ? "A3" : "A1"}` : "Nenhum arquivo anexado nesta sessão"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="py-10 text-center text-sand-400">Nenhum certificado encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TooltipProvider>

      <CertificadoFormDialog
        key={`${editing?.id ?? "new"}-${formSession}`}
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        certificado={editing}
      />
    </div>
  );
}
