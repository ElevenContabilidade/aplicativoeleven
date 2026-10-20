"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { teamName } from "@/lib/team-lookup";
import type { Lead } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatTile, dataDecisaoLead, diasEntre } from "./crm-shared";

/** Aba Métricas: tempo médio de decisão, comparação fechados x perdidos (em
 * dias) e ranking de fechamentos por responsável — clicável, mostra quais
 * leads cada um fechou. */
export function CrmMetricasTab({ leadsFiltrados, periodoLabel }: { leadsFiltrados: Lead[]; periodoLabel: string }) {
  const [responsavelAberto, setResponsavelAberto] = useState<string | null>(null);

  const decididos = useMemo(() => leadsFiltrados.filter((l) => l.stage === "Fechado" || l.stage === "Perdido"), [leadsFiltrados]);
  const fechados = useMemo(() => leadsFiltrados.filter((l) => l.stage === "Fechado"), [leadsFiltrados]);
  const perdidos = useMemo(() => leadsFiltrados.filter((l) => l.stage === "Perdido"), [leadsFiltrados]);

  const diasPorLead = useMemo(
    () => new Map(decididos.map((l) => [l.id, diasEntre(l.dataEntrada, dataDecisaoLead(l))])),
    [decididos]
  );

  const tempoMedioDecisao = decididos.length > 0
    ? Math.round(decididos.reduce((sum, l) => sum + (diasPorLead.get(l.id) ?? 0), 0) / decididos.length)
    : 0;
  const mediaFechados = fechados.length > 0
    ? Math.round(fechados.reduce((sum, l) => sum + (diasPorLead.get(l.id) ?? 0), 0) / fechados.length)
    : 0;
  const mediaPerdidos = perdidos.length > 0
    ? Math.round(perdidos.reduce((sum, l) => sum + (diasPorLead.get(l.id) ?? 0), 0) / perdidos.length)
    : 0;

  const ranking = useMemo(() => {
    const map = new Map<string, Lead[]>();
    fechados.forEach((l) => map.set(l.responsavelId, [...(map.get(l.responsavelId) ?? []), l]));
    return [...map.entries()]
      .map(([responsavelId, leads]) => ({
        responsavelId,
        leads,
        total: leads.length,
        valor: leads.reduce((sum, l) => sum + l.valorEstimado, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [fechados]);

  const leadsDoResponsavelAberto = responsavelAberto ? ranking.find((r) => r.responsavelId === responsavelAberto)?.leads ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label={`Leads decididos — ${periodoLabel}`} value={String(decididos.length)} />
        <StatTile label="Tempo médio de decisão" value={`${tempoMedioDecisao} dias`} highlight />
        <StatTile label="Média — fechados" value={`${mediaFechados} dias`} />
        <StatTile label="Média — perdidos" value={`${mediaPerdidos} dias`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking de fechamentos por responsável</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 pt-4">
          {ranking.map((r, i) => (
            <button
              key={r.responsavelId}
              type="button"
              onClick={() => setResponsavelAberto(r.responsavelId)}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-sand-200 px-3 py-2 text-left text-xs transition-colors hover:bg-sand-50"
            >
              <span className="flex items-center gap-2">
                {i === 0 && <Trophy className="size-3.5 text-amber-500" />}
                <span className="font-medium text-sand-900">{teamName(r.responsavelId)}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-sand-500">{formatCurrency(r.valor)}</span>
                <span className="rounded-full bg-wine-100 px-2 py-0.5 font-semibold text-wine-800">{r.total} fechado{r.total !== 1 ? "s" : ""}</span>
              </span>
            </button>
          ))}
          {ranking.length === 0 && <p className="text-xs text-sand-400">Nenhum fechamento no período.</p>}
        </CardContent>
      </Card>

      <Dialog open={!!responsavelAberto} onOpenChange={(open) => !open && setResponsavelAberto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leads fechados — {responsavelAberto ? teamName(responsavelAberto) : ""}</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Dias até fechar</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadsDoResponsavelAberto.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-sand-900">{l.nome}</TableCell>
                  <TableCell>{formatCurrency(l.valorEstimado)}</TableCell>
                  <TableCell>{diasPorLead.get(l.id) ?? "—"}</TableCell>
                  <TableCell>{formatDate(l.dataUltimoContato)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
