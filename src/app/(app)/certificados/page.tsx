"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldAlert, ShieldCheck, ShieldX, Clock, Plus, Eye, EyeOff, Pencil, Download } from "lucide-react";
import { CertificadoFormDialog } from "@/components/certificates/certificado-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CERTIFICADO_STATUS, type Certificado } from "@/lib/types";

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

export default function CertificadosPage() {
  const certificados = useAppStore((s) => s.certificados);
  const clients = useAppStore((s) => s.clients);
  const documentos = useAppStore((s) => s.documentos);
  const [status, setStatus] = useState("Todos");
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
    return certificados
      .filter((c) => status === "Todos" || c.status === status)
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));
  }, [certificados, status]);

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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            {CERTIFICADO_STATUS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Alerta</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
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
