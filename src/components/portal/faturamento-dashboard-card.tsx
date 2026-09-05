"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FaturamentoMensal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const WINE = "#5C1420";
const GOLD = "#E6C378";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function labelCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  return `${MESES_ABREV[Number(mes) - 1] ?? mes}/${ano.slice(2)}`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-sand-50 p-3">
      <p className="text-[11px] text-sand-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-sand-900">{value}</p>
    </div>
  );
}

/** Dashboard de faturamento e imposto pago no Portal do Cliente — lido a
 * partir do que a equipe lança na tela de Faturamento (interno), mês a mês,
 * a partir da guia do período (PGDAS, DAS etc). */
export function FaturamentoDashboardCard({ faturamento }: { faturamento: FaturamentoMensal[] }) {
  const ordenado = [...faturamento].sort((a, b) => a.competencia.localeCompare(b.competencia));

  if (ordenado.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="size-4 text-wine-600" /> Meu faturamento</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-xs text-sand-400">
            Ainda não há dados de faturamento lançados. Assim que sua contabilidade lançar a guia do mês, seu faturamento e o
            imposto pago aparecem aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  const ultimo = ordenado[ordenado.length - 1];
  const somaFaturamento = ordenado.reduce((a, f) => a + (f.faturamento ?? 0), 0);
  const somaImposto = ordenado.reduce((a, f) => a + (f.imposto ?? 0), 0);
  const cargaMedia = somaFaturamento > 0 ? (somaImposto / somaFaturamento) * 100 : 0;
  const cargaUltimo = ultimo.faturamento ? ((ultimo.imposto ?? 0) / ultimo.faturamento) * 100 : 0;

  const grafico = ordenado.slice(-12).map((f) => ({
    competencia: labelCompetencia(f.competencia),
    Faturamento: f.faturamento ?? 0,
    Imposto: f.imposto ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="size-4 text-wine-600" /> Meu faturamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={`Faturamento (${labelCompetencia(ultimo.competencia)})`} value={formatCurrency(ultimo.faturamento ?? 0)} />
          <StatTile label={`Imposto pago (${labelCompetencia(ultimo.competencia)})`} value={formatCurrency(ultimo.imposto ?? 0)} />
          <StatTile label="Carga tributária do mês" value={`${cargaUltimo.toFixed(1)}%`} />
          <StatTile label="Carga tributária média" value={`${cargaMedia.toFixed(1)}%`} />
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={grafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9E3D6" vertical={false} />
              <XAxis dataKey="competencia" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v).replace(",00", "")} width={80} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Faturamento" fill={WINE} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Imposto" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
