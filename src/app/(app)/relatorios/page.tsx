"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store/app-store";
import { formatCurrency } from "@/lib/utils";

const WINE = "#5C1420";
const GOLD = "#E6C378";
const PIE_COLORS = ["#5C1420", "#8A2F3E", "#E6C378", "#B4791F", "#3E6B8A", "#2E7D53", "#948977"];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="pt-4">
        <div className="h-64 w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

export default function RelatoriosPage() {
  const leads = useAppStore((s) => s.leads);
  const clients = useAppStore((s) => s.clients);
  const tasks = useAppStore((s) => s.tasks);

  const leadsPorOrigem = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => map.set(l.origem, (map.get(l.origem) ?? 0) + 1));
    return Array.from(map, ([origem, total]) => ({ origem, total }));
  }, [leads]);

  const clientesPorSegmento = useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((c) => map.set(c.segmento, (map.get(c.segmento) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [clients]);

  const clientesPorRegime = useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((c) => map.set(c.dados.regimeTributario, (map.get(c.dados.regimeTributario) ?? 0) + 1));
    return Array.from(map, ([regime, total]) => ({ regime, total }));
  }, [clients]);

  const tarefasPorStatus = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => map.set(t.status, (map.get(t.status) ?? 0) + 1));
    return Array.from(map, ([status, total]) => ({ status, total }));
  }, [tasks]);

  const receitaMensal = useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((c) => c.historicoFinanceiro.forEach((h) => map.set(h.competencia, (map.get(h.competencia) ?? 0) + h.valor)));
    return Array.from(map, ([mes, total]) => ({ mes, total })).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [clients]);

  return (
    <div>
      <PageHeader title="Relatórios" description="Indicadores gerenciais consolidados de Comercial, Clientes, Operação e Financeiro." />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Leads por origem">
          <ResponsiveContainer>
            <BarChart data={leadsPorOrigem}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
              <XAxis dataKey="origem" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill={WINE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Clientes por segmento">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={clientesPorSegmento} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {clientesPorSegmento.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Clientes por regime tributário">
          <ResponsiveContainer>
            <BarChart data={clientesPorRegime} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="regime" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="total" fill={GOLD} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tarefas por status">
          <ResponsiveContainer>
            <BarChart data={tarefasPorStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#3E6B8A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Receita mensal (honorários)</CardTitle></CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={receitaMensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Line type="monotone" dataKey="total" stroke={WINE} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
