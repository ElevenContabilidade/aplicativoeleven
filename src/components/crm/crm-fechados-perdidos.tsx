"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { teamName } from "@/lib/team-lookup";
import type { Lead } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ChartCard, StatTile, WINE } from "./crm-shared";

/** Aba Fechados: estatísticas de conversão do período + lista dos leads
 * fechados, mais recentes primeiro. */
export function CrmFechadosTab({ leadsFiltrados, periodoLabel }: { leadsFiltrados: Lead[]; periodoLabel: string }) {
  const fechados = useMemo(
    () => leadsFiltrados.filter((l) => l.stage === "Fechado").sort((a, b) => b.dataUltimoContato.localeCompare(a.dataUltimoContato)),
    [leadsFiltrados]
  );
  const taxaConversao = leadsFiltrados.length > 0 ? Math.round((fechados.length / leadsFiltrados.length) * 100) : 0;
  const valorFechado = fechados.reduce((sum, l) => sum + l.valorEstimado, 0);
  const ticketMedio = fechados.length > 0 ? valorFechado / fechados.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label={`Fechados — ${periodoLabel}`} value={String(fechados.length)} highlight />
        <StatTile label="Taxa de conversão" value={`${taxaConversao}%`} />
        <StatTile label="Valor fechado" value={formatCurrency(valorFechado)} />
        <StatTile label="Ticket médio" value={formatCurrency(ticketMedio)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Leads fechados</CardTitle></CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fechados.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-sand-900">{l.nome}</TableCell>
                  <TableCell>{teamName(l.responsavelId)}</TableCell>
                  <TableCell>{l.origem}</TableCell>
                  <TableCell className="font-semibold text-wine-700">{formatCurrency(l.valorEstimado)}</TableCell>
                  <TableCell>{formatDate(l.dataUltimoContato)}</TableCell>
                </TableRow>
              ))}
              {fechados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sand-400">Nenhum lead fechado no período.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/** Aba Perdidos: estatísticas de perda do período (contagem, taxa, valor
 * perdido e principal motivo) + distribuição por motivo + lista. */
export function CrmPerdidosTab({ leadsFiltrados, periodoLabel }: { leadsFiltrados: Lead[]; periodoLabel: string }) {
  const [motivoFiltro, setMotivoFiltro] = useState<string | null>(null);

  const perdidos = useMemo(
    () => leadsFiltrados.filter((l) => l.stage === "Perdido").sort((a, b) => b.dataUltimoContato.localeCompare(a.dataUltimoContato)),
    [leadsFiltrados]
  );
  const taxaPerda = leadsFiltrados.length > 0 ? Math.round((perdidos.length / leadsFiltrados.length) * 100) : 0;
  const valorPerdido = perdidos.reduce((sum, l) => sum + l.valorEstimado, 0);

  const porMotivo = useMemo(() => {
    const map = new Map<string, number>();
    perdidos.forEach((l) => {
      const motivo = l.motivoPerda?.trim() || "Não informado";
      map.set(motivo, (map.get(motivo) ?? 0) + 1);
    });
    return [...map.entries()].map(([motivo, total]) => ({ motivo, total })).sort((a, b) => b.total - a.total);
  }, [perdidos]);

  const principalMotivo = porMotivo[0]?.motivo ?? "—";

  const listaFiltrada = motivoFiltro ? perdidos.filter((l) => (l.motivoPerda?.trim() || "Não informado") === motivoFiltro) : perdidos;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label={`Perdidos — ${periodoLabel}`} value={String(perdidos.length)} />
        <StatTile label="Taxa de perda" value={`${taxaPerda}%`} />
        <StatTile label="Valor total perdido" value={formatCurrency(valorPerdido)} />
        <StatTile label="Principal motivo" value={principalMotivo} />
      </div>

      <ChartCard title="Motivos de perda">
        <ResponsiveContainer>
          <BarChart data={porMotivo} onClick={(e) => typeof e?.activeLabel === "string" && setMotivoFiltro(e.activeLabel)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
            <XAxis dataKey="motivo" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={55} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" fill={WINE} radius={[4, 4, 0, 0]} className="cursor-pointer" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardHeader>
          <CardTitle>Leads perdidos{motivoFiltro && ` — ${motivoFiltro}`}</CardTitle>
          {motivoFiltro && (
            <button type="button" onClick={() => setMotivoFiltro(null)} className="text-[11px] text-sand-500 hover:text-wine-700 hover:underline">
              Limpar filtro
            </button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Valor estimado</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listaFiltrada.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-sand-900">{l.nome}</TableCell>
                  <TableCell><Badge variant="outline">{l.motivoPerda?.trim() || "Não informado"}</Badge></TableCell>
                  <TableCell>{teamName(l.responsavelId)}</TableCell>
                  <TableCell>{formatCurrency(l.valorEstimado)}</TableCell>
                  <TableCell>{formatDate(l.dataUltimoContato)}</TableCell>
                </TableRow>
              ))}
              {listaFiltrada.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sand-400">Nenhum lead perdido no período.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
