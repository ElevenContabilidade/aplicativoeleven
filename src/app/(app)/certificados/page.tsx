"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, ShieldX, Clock } from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  const [status, setStatus] = useState("Todos");

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
      <PageHeader title="Certificados digitais" description="Gestão de e-CPF e e-CNPJ da carteira, com alertas de vencimento." />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Em dia" value={emDia} icon={ShieldCheck} tone="success" />
        <MetricCard label="Vencendo em 60d" value={vencendo60} icon={Clock} tone="wine" />
        <MetricCard label="Vencendo em 30d" value={vencendo30} icon={ShieldAlert} tone="warning" />
        <MetricCard label="Vencidos" value={vencidos} icon={ShieldX} tone="danger" />
      </div>

      <div className="mb-4">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            {["Agendamento solicitado", "Agendamento realizado", "Aguardando validação", "Validado", "Certificado aprovado", "Entregue", "Renovação próxima", "Vencido"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => {
            const client = clients.find((cl) => cl.id === c.clienteId);
            const days = daysUntil(c.dataVencimento);
            return (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{client?.dados.nomeFantasia ?? client?.dados.razaoSocial}</TableCell>
                <TableCell>{c.tipo}</TableCell>
                <TableCell className="text-sand-500">{c.documento}</TableCell>
                <TableCell>{formatDate(c.dataVencimento)}</TableCell>
                <TableCell>{expiryBadge(days)}</TableCell>
                <TableCell>{formatCurrency(c.valor)}</TableCell>
                <TableCell><StatusBadge status={c.status} /></TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhum certificado encontrado.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
