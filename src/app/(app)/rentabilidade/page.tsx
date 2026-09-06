"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PiggyBank, Search, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { calcularRentabilidade } from "@/lib/rentabilidade";
import { cn, formatCurrency } from "@/lib/utils";

function margemTone(percentual: number): string {
  if (percentual < 20) return "text-status-danger";
  if (percentual < 50) return "text-status-warning";
  return "text-status-success";
}

export default function RentabilidadePage() {
  const clients = useAppStore((s) => s.clients);
  const team = useAppStore((s) => s.team);
  const [busca, setBusca] = useState("");

  const nenhumCustoInformado = useMemo(() => team.every((m) => !m.custoMensal), [team]);

  const linhas = useMemo(() => {
    const clientesComHonorario = clients.filter((c) => (c.financeiro.valorMensal ?? 0) > 0);
    const calculadas = calcularRentabilidade(clientesComHonorario, team);
    return calculadas
      .filter((l) => !busca.trim() || l.nome.toLowerCase().includes(busca.trim().toLowerCase()))
      .sort((a, b) => a.margemPercentual - b.margemPercentual);
  }, [clients, team, busca]);

  const receitaTotal = linhas.reduce((a, l) => a + l.receita, 0);
  const custoTotal = linhas.reduce((a, l) => a + l.custo, 0);
  const margemTotal = receitaTotal - custoTotal;
  const margemMediaPercentual = receitaTotal > 0 ? (margemTotal / receitaTotal) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="Rentabilidade por cliente"
        description="Estimativa de margem: honorário mensal menos o custo estimado da equipe que atende cada cliente."
      />

      {nenhumCustoInformado && (
        <Card className="mb-6 border-status-warning/40 bg-status-warning-bg">
          <CardContent className="flex items-start gap-2 p-4 text-xs text-status-warning">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              Nenhum colaborador tem custo mensal informado ainda, então o custo estimado aparece zerado. Configure em{" "}
              <Link href="/equipe" className="underline">Equipe</Link>, no cadastro de cada colaborador.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <MetricCard label="Receita mensal total" value={formatCurrency(receitaTotal)} icon={PiggyBank} tone="wine" />
        <MetricCard label="Custo estimado total" value={formatCurrency(custoTotal)} icon={PiggyBank} tone="neutral" />
        <MetricCard label="Margem total" value={formatCurrency(margemTotal)} icon={PiggyBank} tone={margemTotal >= 0 ? "success" : "danger"} />
        <MetricCard label="Margem média" value={`${margemMediaPercentual.toFixed(1)}%`} icon={PiggyBank} tone="success" />
      </div>

      <div className="mb-4 relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Filtrar por cliente" className="pl-8" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes ({linhas.length}) — piores margens primeiro</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            Custo estimado reparte o custo mensal de cada colaborador (cadastrado em Equipe) entre todos os clientes em
            que ele é responsável — é uma aproximação por carteira, não apontamento de horas reais.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-36">Receita mensal</TableHead>
                <TableHead className="w-36">Custo estimado</TableHead>
                <TableHead className="w-36">Margem</TableHead>
                <TableHead className="w-24 text-right">Margem %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.clienteId}>
                  <TableCell className="font-medium">
                    <Link href={`/clientes/${l.clienteId}`} className="hover:text-wine-700 hover:underline">{l.nome}</Link>
                  </TableCell>
                  <TableCell>{formatCurrency(l.receita)}</TableCell>
                  <TableCell>{formatCurrency(l.custo)}</TableCell>
                  <TableCell className={cn("font-medium", margemTone(l.margemPercentual))}>{formatCurrency(l.margem)}</TableCell>
                  <TableCell className={cn("text-right font-medium", margemTone(l.margemPercentual))}>
                    {l.margemPercentual.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              {linhas.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sand-400">Nenhum cliente com honorário cadastrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
