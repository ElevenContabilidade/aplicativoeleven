"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_STAGES, type Lead } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ChartCard, StatTile, WINE, WINE_SHADES, GOLD, MESES } from "./crm-shared";

/** Gráfico de barras com a distribuição dos leads do período por etapa do
 * funil — usado na aba Pipeline, acima do Kanban. */
export function CrmPipelineChart({ leadsFiltrados, periodoLabel }: { leadsFiltrados: Lead[]; periodoLabel: string }) {
  const porEtapa = useMemo(
    () => LEAD_STAGES.map((stage) => ({ stage, total: leadsFiltrados.filter((l) => l.stage === stage).length })),
    [leadsFiltrados]
  );

  return (
    <ChartCard title={`Leads por etapa do funil — ${periodoLabel}`}>
      <ResponsiveContainer>
        <BarChart data={porEtapa}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
          <XAxis dataKey="stage" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="total" fill={WINE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/** 4 cartões-resumo do período (leads, pipeline em aberto, taxa de
 * conversão, ticket médio dos fechados) — usados na aba Dashboard. */
export function CrmDashboardStats({ leadsFiltrados, periodoLabel }: { leadsFiltrados: Lead[]; periodoLabel: string }) {
  const fechados = leadsFiltrados.filter((l) => l.stage === "Fechado");
  const valorFechado = fechados.reduce((sum, l) => sum + l.valorEstimado, 0);
  const taxaConversao = leadsFiltrados.length > 0 ? Math.round((fechados.length / leadsFiltrados.length) * 100) : 0;
  const valorPipeline = leadsFiltrados
    .filter((l) => l.stage !== "Fechado" && l.stage !== "Perdido")
    .reduce((sum, l) => sum + l.valorEstimado, 0);
  const ticketMedio = fechados.length > 0 ? valorFechado / fechados.length : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <StatTile label={`Leads — ${periodoLabel}`} value={String(leadsFiltrados.length)} />
      <StatTile label="Valor em pipeline" value={formatCurrency(valorPipeline)} />
      <StatTile label="Taxa de conversão" value={`${taxaConversao}%`} />
      <StatTile label="Ticket médio (fechados)" value={formatCurrency(ticketMedio)} />
    </div>
  );
}

function Podio({ top3 }: { top3: { mes: string; total: number }[] }) {
  const ordemVisual = [top3[1], top3[0], top3[2]]; // 2º, 1º, 3º — visual de pódio
  const alturas = ["h-16", "h-24", "h-12"];
  const medalhas = ["🥈", "🥇", "🥉"];

  return (
    <div className="flex items-end justify-center gap-3">
      {ordemVisual.map((item, i) =>
        item ? (
          <div key={item.mes} className="flex flex-col items-center gap-1">
            <span className="text-lg">{medalhas[i]}</span>
            <div
              className={`flex ${alturas[i]} w-20 flex-col items-center justify-end rounded-t-lg border border-wine-200 bg-wine-50 pb-1.5`}
            >
              <span className="text-sm font-bold text-wine-700">{item.total}</span>
            </div>
            <span className="text-[11px] font-medium text-sand-600">{item.mes}</span>
          </div>
        ) : (
          <div key={i} className="w-20" />
        )
      )}
    </div>
  );
}

/** Aba Aquisição: origem dos leads, serviços mais procurados e distribuição
 * mensal (donut + pódio do melhor mês do ano). */
export function CrmAquisicao({ leadsFiltrados, leadsDoAno }: { leadsFiltrados: Lead[]; leadsDoAno: Lead[] }) {
  const porOrigem = useMemo(() => {
    const map = new Map<string, number>();
    leadsFiltrados.forEach((l) => map.set(l.origem, (map.get(l.origem) ?? 0) + 1));
    return [...map.entries()].map(([origem, total]) => ({ origem, total })).sort((a, b) => b.total - a.total);
  }, [leadsFiltrados]);

  const servicosMaisProcurados = useMemo(() => {
    const map = new Map<string, number>();
    leadsFiltrados.forEach((l) => l.servicosInteresse.forEach((s) => map.set(s, (map.get(s) ?? 0) + 1)));
    return [...map.entries()].map(([servico, total]) => ({ servico, total })).sort((a, b) => b.total - a.total);
  }, [leadsFiltrados]);

  // Sempre quebrado pelos 12 meses do ano selecionado, independente do mês
  // ativo no seletor — filtrar esse gráfico por mês não faria sentido.
  const porMes = useMemo(() => {
    const counts = Array(12).fill(0);
    leadsDoAno.forEach((l) => {
      const m = Number(l.dataEntrada.slice(5, 7)) - 1;
      if (m >= 0 && m < 12) counts[m]++;
    });
    return MESES.map((mesLabel, i) => ({ mes: mesLabel, total: counts[i] }));
  }, [leadsDoAno]);

  const porMesComLeads = useMemo(() => porMes.filter((m) => m.total > 0), [porMes]);
  const top3Meses = useMemo(() => [...porMes].sort((a, b) => b.total - a.total).slice(0, 3), [porMes]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Leads por origem">
        <ResponsiveContainer>
          <BarChart data={porOrigem}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
            <XAxis dataKey="origem" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" fill={GOLD} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardHeader><CardTitle>Serviços mais procurados</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 pt-4">
          {servicosMaisProcurados.map((s) => (
            <div key={s.servico} className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 text-xs">
              <span className="text-sand-800">{s.servico}</span>
              <span className="font-semibold text-wine-700">{s.total}</span>
            </div>
          ))}
          {servicosMaisProcurados.length === 0 && <p className="text-xs text-sand-400">Sem dados no período.</p>}
        </CardContent>
      </Card>

      <ChartCard title="Leads por mês">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={porMesComLeads} dataKey="total" nameKey="mes" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
              {porMesComLeads.map((entry, i) => (
                <Cell key={entry.mes} fill={WINE_SHADES[i % WINE_SHADES.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        {porMesComLeads.length === 0 && <p className="mt-2 text-center text-xs text-sand-400">Sem leads no ano.</p>}
      </ChartCard>

      <Card>
        <CardHeader><CardTitle>Melhor mês do ano</CardTitle></CardHeader>
        <CardContent className="flex min-h-[224px] items-center justify-center pt-4">
          {top3Meses[0] && top3Meses[0].total > 0 ? (
            <Podio top3={top3Meses} />
          ) : (
            <p className="text-xs text-sand-400">Sem dados no ano.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
