"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/lib/store/app-store";
import { LEAD_STAGES } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const WINE = "#5C1420";
const GOLD = "#E6C378";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type AnalyticsTab = "pipeline" | "fechados" | "aquisicao" | "geral";

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="pt-4">
        <div className="h-56 w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] text-sand-500">{label}</p>
        <p className="mt-1 text-lg font-semibold text-sand-900">{value}</p>
      </CardContent>
    </Card>
  );
}

export function CrmAnalytics() {
  const leads = useAppStore((s) => s.leads);
  const [tab, setTab] = useState<AnalyticsTab>("pipeline");

  const years = useMemo(() => {
    const set = new Set(leads.map((l) => l.dataEntrada.slice(0, 4)));
    set.add(new Date().getFullYear().toString());
    return [...set].sort().reverse();
  }, [leads]);
  const [year, setYear] = useState(years[0]);

  const leadsDoAno = useMemo(() => leads.filter((l) => l.dataEntrada.startsWith(year)), [leads, year]);

  const porEtapa = useMemo(
    () => LEAD_STAGES.map((stage) => ({ stage, total: leadsDoAno.filter((l) => l.stage === stage).length })),
    [leadsDoAno]
  );

  const fechados = leadsDoAno.filter((l) => l.stage === "Fechado");
  const perdidos = leadsDoAno.filter((l) => l.stage === "Perdido");
  const taxaConversao = leadsDoAno.length > 0 ? Math.round((fechados.length / leadsDoAno.length) * 100) : 0;
  const valorFechado = fechados.reduce((sum, l) => sum + l.valorEstimado, 0);

  const porOrigem = useMemo(() => {
    const map = new Map<string, number>();
    leadsDoAno.forEach((l) => map.set(l.origem, (map.get(l.origem) ?? 0) + 1));
    return [...map.entries()].map(([origem, total]) => ({ origem, total })).sort((a, b) => b.total - a.total);
  }, [leadsDoAno]);

  const servicosMaisProcurados = useMemo(() => {
    const map = new Map<string, number>();
    leadsDoAno.forEach((l) => l.servicosInteresse.forEach((s) => map.set(s, (map.get(s) ?? 0) + 1)));
    return [...map.entries()].map(([servico, total]) => ({ servico, total })).sort((a, b) => b.total - a.total);
  }, [leadsDoAno]);

  const porMes = useMemo(() => {
    const counts = Array(12).fill(0);
    leadsDoAno.forEach((l) => {
      const m = Number(l.dataEntrada.slice(5, 7)) - 1;
      if (m >= 0 && m < 12) counts[m]++;
    });
    return MESES.map((mes, i) => ({ mes, total: counts[i] }));
  }, [leadsDoAno]);

  const melhorMes = porMes.reduce((best, m) => (m.total > best.total ? m : best), porMes[0]);

  const valorPipeline = leadsDoAno
    .filter((l) => l.stage !== "Fechado" && l.stage !== "Perdido")
    .reduce((sum, l) => sum + l.valorEstimado, 0);
  const ticketMedio = fechados.length > 0 ? valorFechado / fechados.length : 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>CRM · Lead → Cliente</CardTitle>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map((y) => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as AnalyticsTab)} className="mb-4">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="fechados">Fechados e perdidos</TabsTrigger>
            <TabsTrigger value="aquisicao">Aquisição</TabsTrigger>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "pipeline" && (
          <ChartCard title="Leads por etapa do funil">
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
        )}

        {tab === "fechados" && (
          <div className="grid gap-4 sm:grid-cols-4">
            <StatTile label="Fechados no ano" value={String(fechados.length)} />
            <StatTile label="Perdidos no ano" value={String(perdidos.length)} />
            <StatTile label="Taxa de conversão" value={`${taxaConversao}%`} />
            <StatTile label="Valor fechado" value={formatCurrency(valorFechado)} />
          </div>
        )}

        {tab === "aquisicao" && (
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

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Leads por mês</CardTitle>
                {melhorMes && melhorMes.total > 0 && (
                  <span className="text-xs font-semibold text-wine-700">Melhor mês: {melhorMes.mes} ({melhorMes.total})</span>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-56 w-full">
                  <ResponsiveContainer>
                    <BarChart data={porMes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" fill={WINE} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "geral" && (
          <div className="grid gap-4 sm:grid-cols-4">
            <StatTile label="Leads no ano" value={String(leadsDoAno.length)} />
            <StatTile label="Valor em pipeline" value={formatCurrency(valorPipeline)} />
            <StatTile label="Taxa de conversão" value={`${taxaConversao}%`} />
            <StatTile label="Ticket médio (fechados)" value={formatCurrency(ticketMedio)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
