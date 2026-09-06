"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { calcularRentabilidade } from "@/lib/rentabilidade";
import { calcularProdutividade } from "@/lib/produtividade";
import { mesesSemReajuste } from "@/lib/reajuste-alerts";
import { cn, formatCurrency } from "@/lib/utils";

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

const MESES_PARA_ALERTA_REAJUSTE = 12;

function margemTone(percentual: number): string {
  if (percentual < 20) return "text-status-danger";
  if (percentual < 50) return "text-status-warning";
  return "text-status-success";
}

export default function RelatoriosPage() {
  const leads = useAppStore((s) => s.leads);
  const clients = useAppStore((s) => s.clients);
  const tasks = useAppStore((s) => s.tasks);
  const obligations = useAppStore((s) => s.obligations);
  const team = useAppStore((s) => s.team);

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

  const pioresMargens = useMemo(() => {
    const clientesComHonorario = clients.filter((c) => (c.financeiro.valorMensal ?? 0) > 0);
    return calcularRentabilidade(clientesComHonorario, team)
      .sort((a, b) => a.margemPercentual - b.margemPercentual)
      .slice(0, 5);
  }, [clients, team]);

  const mesAtual = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const maisSobrecarregados = useMemo(() => {
    return calcularProdutividade(team, tasks, obligations, mesAtual)
      .map((p) => ({ ...p, totalAtraso: p.tarefasAtrasadas + p.obrigacoesAtrasadas }))
      .sort((a, b) => b.totalAtraso - a.totalAtraso)
      .slice(0, 5);
  }, [team, tasks, obligations, mesAtual]);

  const reajustesPendentes = useMemo(() => {
    return clients
      .filter((c) => (c.financeiro.valorMensal ?? 0) > 0)
      .map((c) => ({ cliente: c, meses: mesesSemReajuste(c) }))
      .filter((r): r is { cliente: typeof r.cliente; meses: number } => r.meses !== null && r.meses >= MESES_PARA_ALERTA_REAJUSTE)
      .sort((a, b) => b.meses - a.meses)
      .slice(0, 5);
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Piores margens</CardTitle>
            <p className="mt-1 text-xs text-sand-500">
              Clientes com menor rentabilidade estimada. <Link href="/rentabilidade" className="text-wine-700 hover:underline">Ver tudo</Link>
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-20 text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pioresMargens.map((l) => (
                  <TableRow key={l.clienteId}>
                    <TableCell className="max-w-[160px] truncate font-medium">
                      <Link href={`/clientes/${l.clienteId}`} className="hover:text-wine-700 hover:underline">{l.nome}</Link>
                    </TableCell>
                    <TableCell className={cn("text-right font-medium", margemTone(l.margemPercentual))}>
                      {l.margemPercentual.toFixed(0)}%
                    </TableCell>
                  </TableRow>
                ))}
                {pioresMargens.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="py-6 text-center text-sand-400">Sem dados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Colaboradores mais sobrecarregados</CardTitle>
            <p className="mt-1 text-xs text-sand-500">
              Mais tarefas + obrigações em atraso. <Link href="/produtividade" className="text-wine-700 hover:underline">Ver tudo</Link>
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead className="w-24 text-right">Em atraso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maisSobrecarregados.map((p) => (
                  <TableRow key={p.membroId}>
                    <TableCell className="max-w-[160px] truncate font-medium">{p.nome}</TableCell>
                    <TableCell className={cn("text-right font-medium", p.totalAtraso > 0 && "text-status-danger")}>
                      {p.totalAtraso}
                    </TableCell>
                  </TableRow>
                ))}
                {maisSobrecarregados.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="py-6 text-center text-sand-400">Sem dados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reajustes pendentes</CardTitle>
            <p className="mt-1 text-xs text-sand-500">Clientes há 12+ meses sem reajuste de honorário.</p>
          </CardHeader>
          <CardContent className="pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-24 text-right">Meses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reajustesPendentes.map(({ cliente, meses }) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="max-w-[160px] truncate font-medium">
                      <Link href={`/clientes/${cliente.id}`} className="hover:text-wine-700 hover:underline">
                        {cliente.dados.nomeFantasia || cliente.dados.razaoSocial}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium text-status-warning">{meses}</TableCell>
                  </TableRow>
                ))}
                {reajustesPendentes.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="py-6 text-center text-sand-400">Nenhum reajuste pendente.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
