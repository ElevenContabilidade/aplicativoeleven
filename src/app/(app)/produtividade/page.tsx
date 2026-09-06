"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppStore } from "@/lib/store/app-store";
import { calcularProdutividade } from "@/lib/produtividade";
import { cn } from "@/lib/utils";

const WINE = "#5C1420";

export default function ProdutividadePage() {
  const team = useAppStore((s) => s.team);
  const tasks = useAppStore((s) => s.tasks);
  const obligations = useAppStore((s) => s.obligations);

  const mesAtual = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const linhas = useMemo(
    () => calcularProdutividade(team, tasks, obligations, mesAtual).sort((a, b) => b.tarefasAtrasadas - a.tarefasAtrasadas),
    [team, tasks, obligations, mesAtual]
  );

  const chartData = useMemo(
    () => linhas.map((l) => ({ nome: l.nome.split(" ")[0], concluidas: l.obrigacoesConcluidasMes })),
    [linhas]
  );

  const totalTarefasAtrasadas = linhas.reduce((a, l) => a + l.tarefasAtrasadas, 0);
  const totalObrigacoesAtrasadas = linhas.reduce((a, l) => a + l.obrigacoesAtrasadas, 0);

  return (
    <div>
      <PageHeader
        title="Produtividade da equipe"
        description="Carga de trabalho e atrasos por colaborador, com base nas tarefas e obrigações atribuídas a cada um."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Colaboradores ativos" value={linhas.length} icon={Gauge} tone="wine" />
        <MetricCard label="Tarefas em atraso (total)" value={totalTarefasAtrasadas} icon={Gauge} tone={totalTarefasAtrasadas > 0 ? "danger" : "success"} />
        <MetricCard label="Obrigações em atraso (total)" value={totalObrigacoesAtrasadas} icon={Gauge} tone={totalObrigacoesAtrasadas > 0 ? "danger" : "success"} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Obrigações concluídas no mês, por colaborador</CardTitle></CardHeader>
        <CardContent className="pt-4">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="concluidas" fill={WINE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carga por colaborador</CardTitle>
          <p className="mt-1 text-xs text-sand-500">
            Tarefas não têm data de conclusão registrada, então &ldquo;atrasada&rdquo; é o único corte de prazo possível ali —
            obrigações já têm data de conclusão e por isso dá pra contar por mês.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead className="w-32 text-center">Tarefas ativas</TableHead>
                <TableHead className="w-36 text-center">Tarefas em atraso</TableHead>
                <TableHead className="w-44 text-center">Obrigações concluídas (mês)</TableHead>
                <TableHead className="w-40 text-center">Obrigações em atraso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.membroId}>
                  <TableCell className="font-medium">{l.nome}</TableCell>
                  <TableCell className="text-center">{l.tarefasAtivas}</TableCell>
                  <TableCell className={cn("text-center font-medium", l.tarefasAtrasadas > 0 && "text-status-danger")}>
                    {l.tarefasAtrasadas}
                  </TableCell>
                  <TableCell className="text-center">{l.obrigacoesConcluidasMes}</TableCell>
                  <TableCell className={cn("text-center font-medium", l.obrigacoesAtrasadas > 0 && "text-status-danger")}>
                    {l.obrigacoesAtrasadas}
                  </TableCell>
                </TableRow>
              ))}
              {linhas.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-sand-400">Nenhum colaborador ativo.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
