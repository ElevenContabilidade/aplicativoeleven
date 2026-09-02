"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  UserCheck,
  UserX,
  LogOut as UserLeaving,
  TrendingUp,
  PhoneCall,
  CalendarCheck,
  FileText,
  Handshake,
  Percent,
  ListTodo,
  AlarmClockOff,
  CalendarClock,
  AlertOctagon,
  Wallet,
  CircleDollarSign,
  CircleAlert,
  Repeat,
  ShieldAlert,
  ShieldPlus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard, SectionCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamMember, teamName } from "@/lib/team-lookup";
import { formatCurrency, formatDate } from "@/lib/utils";

const PERIODS = ["Hoje", "Semana", "Mês", "Trimestre", "Ano", "Personalizado"] as const;
const PERIOD_DAYS: Record<(typeof PERIODS)[number], number> = {
  Hoje: 1,
  Semana: 7,
  Mês: 30,
  Trimestre: 90,
  Ano: 365,
  Personalizado: 30,
};

function daysFromToday(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Mês");
  const clients = useAppStore((s) => s.clients);
  const leads = useAppStore((s) => s.leads);
  const tasks = useAppStore((s) => s.tasks);
  const obligations = useAppStore((s) => s.obligations);
  const certificados = useAppStore((s) => s.certificados);
  const { userId } = useAuthStore();
  const me = teamMember(userId ?? "");

  const windowDays = PERIOD_DAYS[period];

  const metrics = useMemo(() => {
    const ativos = clients.filter((c) => c.status === "Ativo").length;
    const onboarding = clients.filter((c) => c.status === "Onboarding" || c.status === "Implantação").length;
    const suspensos = clients.filter((c) => c.status === "Suspenso").length;
    const inadimplentes = clients.filter((c) => c.financeiro.statusFinanceiro === "Atrasado").length;
    const saida = clients.filter((c) => c.status === "Em processo de cancelamento").length;

    const leadsNovos = leads.filter((l) => daysFromToday(l.dataEntrada) >= -windowDays).length;
    const leadsEmContato = leads.filter((l) => ["Primeiro contato", "Contato realizado", "Qualificação"].includes(l.stage)).length;
    const reunioes = leads.filter((l) => l.stage === "Reunião agendada" || l.stage === "Reunião realizada").length;
    const propostas = leads.filter((l) => l.stage === "Proposta enviada").length;
    const negociacoes = leads.filter((l) => l.stage === "Negociação" || l.stage === "Aguardando retorno").length;
    const fechados = leads.filter((l) => l.stage === "Fechado").length;
    const conversao = leads.length ? ((fechados / leads.length) * 100).toFixed(1) : "0.0";

    const tarefasAbertas = tasks.filter((t) => !["Concluída", "Cancelada"].includes(t.status)).length;
    const tarefasVencidas = tasks.filter((t) => !["Concluída", "Cancelada"].includes(t.status) && daysFromToday(t.prazo) < 0).length;
    const obrigacoesHoje = obligations.filter((o) => daysFromToday(o.vencimento) === 0).length;
    const obrigacoes7d = obligations.filter((o) => daysFromToday(o.vencimento) >= 0 && daysFromToday(o.vencimento) <= 7).length;
    const pendenciasCriticas = obligations.filter((o) => o.status === "Em atraso").length;

    const honorariosPrevistos = clients.filter((c) => c.status === "Ativo").reduce((a, c) => a + c.financeiro.valorMensal, 0);
    const historico = clients.flatMap((c) => c.historicoFinanceiro);
    const recebidos = historico.filter((h) => h.status === "Pago").reduce((a, h) => a + h.valor, 0);
    const emAberto = historico.filter((h) => h.status === "Em aberto").reduce((a, h) => a + h.valor, 0);
    const inadimplencia = historico.filter((h) => h.status === "Atrasado").reduce((a, h) => a + h.valor, 0);

    const certVencendo = certificados.filter((c) => c.status === "Aguardando Renovação" || (daysFromToday(c.dataVencimento) >= 0 && daysFromToday(c.dataVencimento) <= 30)).length;
    const certVencidos = certificados.filter((c) => c.status === "Vencido").length;
    const certEmitidosMes = certificados.filter((c) => c.dataEmissao && daysFromToday(c.dataEmissao) >= -30).length;

    return {
      ativos, onboarding, suspensos, inadimplentes, saida,
      leadsNovos, leadsEmContato, reunioes, propostas, negociacoes, fechados, conversao,
      tarefasAbertas, tarefasVencidas, obrigacoesHoje, obrigacoes7d, pendenciasCriticas,
      honorariosPrevistos, recebidos, emAberto, inadimplencia,
      certVencendo, certVencidos, certEmitidosMes,
    };
  }, [clients, leads, tasks, obligations, certificados, windowDays]);

  const myTasks = tasks.filter((t) => t.responsavelId === userId && !["Concluída", "Cancelada"].includes(t.status)).slice(0, 6);
  const myLeads = leads.filter((l) => l.responsavelId === userId && !["Fechado", "Perdido"].includes(l.stage)).slice(0, 6);
  const isComercial = me?.perfil === "Comercial";
  const isOperacional = ["Fiscal", "Contábil", "Departamento Pessoal", "Societário"].includes(me?.perfil ?? "");

  return (
    <div>
      <PageHeader
        title={`Olá, ${me?.nome.split(" ")[0] ?? "bem-vindo"} 👋`}
        description="Aqui está o panorama da Eleven Contabilidade hoje."
        actions={
          <Select value={period} onValueChange={(v) => setPeriod(v as (typeof PERIODS)[number])}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {(isComercial || isOperacional) && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {isComercial && (
            <Card>
              <CardHeader>
                <CardTitle>Meus leads em andamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {myLeads.map((l) => (
                  <Link key={l.id} href="/comercial" className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 hover:bg-sand-50">
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-sand-900">{l.nome}</span>
                      <span className="block truncate text-[11px] text-sand-500">{l.empresa}</span>
                    </span>
                    <StatusBadge status={l.stage} />
                  </Link>
                ))}
                {myLeads.length === 0 && <p className="text-xs text-sand-400">Nenhum lead em aberto.</p>}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Minhas tarefas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {myTasks.map((t) => (
                <Link key={t.id} href="/tarefas" className="flex items-center justify-between rounded-lg border border-sand-200 px-3 py-2 hover:bg-sand-50">
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-sand-900">{t.titulo}</span>
                    <span className="block truncate text-[11px] text-sand-500">Prazo {formatDate(t.prazo)}</span>
                  </span>
                  <StatusBadge status={t.status} />
                </Link>
              ))}
              {myTasks.length === 0 && <p className="text-xs text-sand-400">Nenhuma tarefa pendente.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Clientes ativos" value={metrics.ativos} icon={UserCheck} tone="success" />
        <MetricCard label="Em onboarding" value={metrics.onboarding} icon={UserPlus} tone="wine" />
        <MetricCard label="Suspensos" value={metrics.suspensos} icon={UserX} tone="danger" />
        <MetricCard label="Inadimplentes" value={metrics.inadimplentes} icon={CircleAlert} tone="warning" />
        <MetricCard label="Em saída" value={metrics.saida} icon={UserLeaving} tone="neutral" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Comercial">
          <MetricCard label="Leads novos" value={metrics.leadsNovos} icon={UserPlus} />
          <MetricCard label="Em contato" value={metrics.leadsEmContato} icon={PhoneCall} />
          <MetricCard label="Reuniões" value={metrics.reunioes} icon={CalendarCheck} />
          <MetricCard label="Propostas enviadas" value={metrics.propostas} icon={FileText} />
          <MetricCard label="Negociações" value={metrics.negociacoes} icon={Handshake} />
          <MetricCard label="Conversão" value={`${metrics.conversao}%`} icon={Percent} tone="success" />
        </SectionCard>

        <SectionCard title="Operação">
          <MetricCard label="Tarefas abertas" value={metrics.tarefasAbertas} icon={ListTodo} />
          <MetricCard label="Tarefas vencidas" value={metrics.tarefasVencidas} icon={AlarmClockOff} tone="danger" />
          <MetricCard label="Obrigações hoje" value={metrics.obrigacoesHoje} icon={CalendarClock} tone="warning" />
          <MetricCard label="Próx. 7 dias" value={metrics.obrigacoes7d} icon={CalendarClock} />
          <MetricCard label="Pendências críticas" value={metrics.pendenciasCriticas} icon={AlertOctagon} tone="danger" />
        </SectionCard>

        <SectionCard title="Financeiro">
          <MetricCard label="Honorários previstos" value={formatCurrency(metrics.honorariosPrevistos)} icon={Wallet} />
          <MetricCard label="Recebido" value={formatCurrency(metrics.recebidos)} icon={CircleDollarSign} tone="success" />
          <MetricCard label="Em aberto" value={formatCurrency(metrics.emAberto)} icon={Wallet} tone="warning" />
          <MetricCard label="Inadimplência" value={formatCurrency(metrics.inadimplencia)} icon={CircleAlert} tone="danger" />
          <MetricCard label="MRR" value={formatCurrency(metrics.honorariosPrevistos)} icon={Repeat} tone="wine" />
        </SectionCard>

        <SectionCard title="Certificados">
          <MetricCard label="Vencendo (30d)" value={metrics.certVencendo} icon={ShieldAlert} tone="warning" />
          <MetricCard label="Vencidos" value={metrics.certVencidos} icon={ShieldAlert} tone="danger" />
          <MetricCard label="Emitidos no mês" value={metrics.certEmitidosMes} icon={ShieldPlus} tone="success" />
        </SectionCard>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-wine-600" /> Pipeline comercial (resumo)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {["Lead recebido", "Primeiro contato", "Qualificação", "Reunião agendada", "Proposta enviada", "Negociação", "Fechado"].map((stage) => {
                const count = leads.filter((l) => l.stage === stage).length;
                return (
                  <Badge key={stage} variant="outline" className="gap-1.5 py-1">
                    {stage} <span className="font-semibold text-wine-700">{count}</span>
                  </Badge>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-sand-400">
              Responsável destaque: {teamName(leads[0]?.responsavelId ?? "")} • veja o pipeline completo em{" "}
              <Link href="/comercial" className="font-medium text-wine-700 hover:underline">
                Comercial
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
