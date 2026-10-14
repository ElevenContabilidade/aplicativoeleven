"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  TrendingDown,
  PiggyBank,
  Target,
  Scale,
} from "lucide-react";
import { MetricCard, SectionCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store/app-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { teamMember, teamName } from "@/lib/team-lookup";
import { temPermissao } from "@/lib/permissoes";
import { recebidoDoPeriodo } from "@/lib/financeiro-recebido";
import { contasAPagarDoPeriodo } from "@/lib/contas-pagar";
import { rotinasDepartamentosDoMes, type SetorRotina } from "@/lib/obrigacoes-departamentos";
import type { Obligation, ChecklistStatus, Task, Lead } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";

const MESES_NOME = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const PERIODS = ["Hoje", "Semana", "Mês", "Trimestre", "Ano", "Personalizado"] as const;
const PERIOD_DAYS: Record<(typeof PERIODS)[number], number> = {
  Hoje: 1,
  Semana: 7,
  Mês: 30,
  Trimestre: 90,
  Ano: 365,
  Personalizado: 30,
};

const PENDENTES_MANUAL: Obligation["status"][] = ["A fazer", "Em andamento", "Aguardando informação", "Em atraso"];
const PENDENTES_DEPTO: ChecklistStatus[] = ["Pendente", "Em andamento"];

const CATEGORIAS_ATENCAO = ["Obrigações", "Tarefas", "CRM", "Metas"] as const;
type CategoriaAtencao = (typeof CATEGORIAS_ATENCAO)[number];

interface ItemAtencao {
  id: string;
  categoria: CategoriaAtencao;
  titulo: string;
  contexto: string;
  diasAtraso: number;
  href: string;
  rotulo?: string;
}

interface LinhaObrigacaoMes {
  tipo: string;
  setor: SetorRotina | "Manual";
  vencimento: string | null;
  pendente: boolean;
  responsavelId: string | null;
}

function daysFromToday(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function saudacaoPorHora(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** Monta a lista unificada "Precisa de atenção" cruzando Tarefas, Obrigações
 * (rotinas de departamento + obrigações avulsas, agrupadas por tipo igual
 * ao "Próximos prazos" de Obrigações) e CRM — mais o item de Meta, se
 * passado. Só entra quem já venceu ou vence hoje; ordenado do mais
 * atrasado pro mais recente. */
function construirItensAtencao(
  hojeIso: string,
  tarefas: Task[],
  linhasObrigacoes: LinhaObrigacaoMes[],
  leads: Lead[],
  metaItem: ItemAtencao | null
): ItemAtencao[] {
  const itens: ItemAtencao[] = [];

  for (const t of tarefas) {
    const atraso = -daysFromToday(t.prazo);
    if (atraso < 0) continue;
    itens.push({
      id: `tarefa-${t.id}`,
      categoria: "Tarefas",
      titulo: t.titulo,
      contexto: `Tarefas · ${teamName(t.responsavelId)} · ${t.status}`,
      diasAtraso: atraso,
      href: "/tarefas",
    });
  }

  const porTipo = new Map<string, { tipo: string; total: number; concluidas: number; menorVencimentoPendente: string | null }>();
  for (const l of linhasObrigacoes) {
    if (!l.vencimento) continue;
    const atual = porTipo.get(l.tipo) ?? { tipo: l.tipo, total: 0, concluidas: 0, menorVencimentoPendente: null };
    atual.total += 1;
    if (!l.pendente) atual.concluidas += 1;
    else if (!atual.menorVencimentoPendente || l.vencimento < atual.menorVencimentoPendente) atual.menorVencimentoPendente = l.vencimento;
    porTipo.set(l.tipo, atual);
  }
  for (const g of porTipo.values()) {
    if (!g.menorVencimentoPendente || g.menorVencimentoPendente > hojeIso) continue;
    itens.push({
      id: `obrigacao-${g.tipo}`,
      categoria: "Obrigações",
      titulo: `Ciclo: ${g.tipo}`,
      contexto: `Obrigações · ${g.concluidas} de ${g.total} clientes em dia`,
      diasAtraso: -daysFromToday(g.menorVencimentoPendente),
      href: "/obrigacoes",
    });
  }

  for (const l of leads) {
    if (l.stage === "Fechado" || l.stage === "Perdido") continue;
    const semContato = -daysFromToday(l.dataUltimoContato);
    if (semContato < 7) continue;
    itens.push({
      id: `lead-${l.id}`,
      categoria: "CRM",
      titulo: `${l.nome}${l.empresa ? ` · ${l.empresa}` : ""}`,
      contexto: `CRM · ${l.stage} · sem contato há ${semContato} dias`,
      diasAtraso: semContato - 7,
      href: "/comercial",
    });
  }

  if (metaItem) itens.push(metaItem);

  return itens.sort((a, b) => b.diasAtraso - a.diasAtraso);
}

export default function DashboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("Mês");
  const [escopo, setEscopo] = useState<"meus" | "equipe">("meus");
  const [categoriaFiltro, setCategoriaFiltro] = useState<"Tudo" | CategoriaAtencao>("Tudo");
  const clients = useAppStore((s) => s.clients);
  const leads = useAppStore((s) => s.leads);
  const tasks = useAppStore((s) => s.tasks);
  const obligations = useAppStore((s) => s.obligations);
  const checklistFiscal = useAppStore((s) => s.checklistFiscal);
  const checklistContabil = useAppStore((s) => s.checklistContabil);
  const checklistPessoal = useAppStore((s) => s.checklistPessoal);
  const checklistMei = useAppStore((s) => s.checklistMei);
  const dispensasRotina = useAppStore((s) => s.dispensasRotina);
  const metaMensalClientes = useAppStore((s) => s.metaMensalClientes);
  const certificados = useAppStore((s) => s.certificados);
  const recebimentos = useAppStore((s) => s.recebimentos);
  const boletosMensais = useAppStore((s) => s.boletosMensais);
  const recebimentosParceiro = useAppStore((s) => s.recebimentosParceiro);
  const sistemasEscritorio = useAppStore((s) => s.sistemasEscritorio);
  const pagamentosSistemas = useAppStore((s) => s.pagamentosSistemas);
  const despesasAvulsas = useAppStore((s) => s.despesasAvulsas);
  const processosSocietarios = useAppStore((s) => s.processosSocietarios);
  const { userId } = useAuthStore();
  const me = teamMember(userId ?? "");
  const permissoes = useAppStore((s) => s.permissoes);
  const permissoesCarregadas = useAppStore((s) => s.permissoesCarregadas);
  // O Início não é um módulo gerenciável na matriz de permissões (fica
  // sempre acessível), mas os cards de Financeiro que aparecem aqui
  // mostram dado sensível de verdade — então checam a permissão do
  // módulo Financeiro mesmo assim, senão alguém sem acesso à página
  // Financeiro via a mesma informação aqui. Só decide depois que as
  // permissões chegarem do Supabase: antes disso `temPermissao` cai no
  // padrão "liberado" e o card chegaria a piscar pra quem é restrito.
  const podeVerFinanceiro =
    permissoesCarregadas && (!userId || temPermissao(permissoes, userId, "Financeiro", "Visualizar"));

  const windowDays = PERIOD_DAYS[period];
  const hojeIso = new Date().toISOString().slice(0, 10);
  const competenciaAtual = new Date().toISOString().slice(0, 7);

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

    const certVencendo = certificados.filter((c) => daysFromToday(c.dataVencimento) >= 0 && daysFromToday(c.dataVencimento) <= 30).length;
    const certVencidos = certificados.filter((c) => daysFromToday(c.dataVencimento) < 0).length;
    const certEmitidosMes = certificados.filter((c) => c.dataEmissao && daysFromToday(c.dataEmissao) >= -30).length;

    return {
      ativos, onboarding, suspensos, inadimplentes, saida,
      leadsNovos, leadsEmContato, reunioes, propostas, negociacoes, fechados, conversao,
      tarefasAbertas, tarefasVencidas, obrigacoesHoje, obrigacoes7d, pendenciasCriticas,
      honorariosPrevistos, recebidos, emAberto, inadimplencia,
      certVencendo, certVencidos, certEmitidosMes,
    };
  }, [clients, leads, tasks, obligations, certificados, windowDays]);

  const relatorioMensal = useMemo(() => {
    const recebidoMes = recebidoDoPeriodo(clients, recebimentos, boletosMensais, recebimentosParceiro, [competenciaAtual]);
    const contas = contasAPagarDoPeriodo(sistemasEscritorio, pagamentosSistemas, despesasAvulsas, [competenciaAtual]);
    const pagoMes = contas.filter((c) => c.status === "Pago").reduce((a, c) => a + c.valor, 0);
    return { recebidoMes, pagoMes, lucroMes: recebidoMes - pagoMes };
  }, [clients, recebimentos, boletosMensais, recebimentosParceiro, sistemasEscritorio, pagamentosSistemas, despesasAvulsas, competenciaAtual]);

  // "Precisa de atenção": junta Tarefas, Obrigações (rotinas de
  // departamento + avulsas) e CRM parados — igual ao painel do print que a
  // Kauane mandou, mas com dado real do Eleven Hub.
  const rotinasDepto = useMemo(
    () => rotinasDepartamentosDoMes(clients, checklistFiscal, checklistContabil, checklistPessoal, checklistMei, competenciaAtual, dispensasRotina),
    [clients, checklistFiscal, checklistContabil, checklistPessoal, checklistMei, competenciaAtual, dispensasRotina]
  );

  const linhasMes = useMemo<LinhaObrigacaoMes[]>(() => {
    const manuais: LinhaObrigacaoMes[] = obligations
      .filter((o) => o.competencia === competenciaAtual)
      .map((o) => ({ tipo: o.tipo, setor: "Manual", vencimento: o.vencimento, pendente: PENDENTES_MANUAL.includes(o.status), responsavelId: o.responsavelId }));
    const departamentos: LinhaObrigacaoMes[] = rotinasDepto.map((r) => ({
      tipo: r.tipo,
      setor: r.setor,
      vencimento: r.vencimento ?? null,
      pendente: PENDENTES_DEPTO.includes(r.status),
      responsavelId: null,
    }));
    return [...manuais, ...departamentos];
  }, [obligations, rotinasDepto, competenciaAtual]);

  const linhasMesMinhas = useMemo(
    () => linhasMes.filter((l) => (l.setor === "Manual" ? l.responsavelId === userId : me?.perfil === l.setor)),
    [linhasMes, userId, me]
  );

  const tasksAbertas = useMemo(() => tasks.filter((t) => !["Concluída", "Cancelada"].includes(t.status)), [tasks]);
  const tasksMinhas = useMemo(() => tasksAbertas.filter((t) => t.responsavelId === userId), [tasksAbertas, userId]);

  const leadsAtivos = useMemo(() => leads.filter((l) => l.stage !== "Fechado" && l.stage !== "Perdido"), [leads]);
  const leadsMinhas = useMemo(() => leadsAtivos.filter((l) => l.responsavelId === userId), [leadsAtivos, userId]);

  const fechadosNoMes = useMemo(() => {
    return leads.filter((l) => {
      if (l.stage !== "Fechado") return false;
      const ultimaEntradaFechado = [...l.historico].reverse().find((h) => h.paraStage === "Fechado");
      const dataFechamento = ultimaEntradaFechado?.data ?? l.dataUltimoContato;
      return dataFechamento.startsWith(competenciaAtual);
    }).length;
  }, [leads, competenciaAtual]);

  const metaItem = useMemo<ItemAtencao | null>(() => {
    const hoje = new Date();
    const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const fracaoMes = hoje.getDate() / diasNoMes;
    const meta = Math.max(metaMensalClientes, 1);
    const fracaoMeta = fechadosNoMes / meta;
    if (fechadosNoMes >= meta || fracaoMeta >= fracaoMes) return null;
    return {
      id: "meta-clientes",
      categoria: "Metas",
      titulo: "Meta de novos clientes do mês",
      contexto: `Metas · ${fechadosNoMes} de ${meta} clientes fechados`,
      diasAtraso: 1,
      href: "/comercial",
      rotulo: `${Math.round(fracaoMeta * 100)}% da meta`,
    };
  }, [metaMensalClientes, fechadosNoMes]);

  const itensAtencaoEquipe = useMemo(
    () => construirItensAtencao(hojeIso, tasksAbertas, linhasMes, leadsAtivos, metaItem),
    [hojeIso, tasksAbertas, linhasMes, leadsAtivos, metaItem]
  );
  const itensAtencaoMeus = useMemo(
    () => construirItensAtencao(hojeIso, tasksMinhas, linhasMesMinhas, leadsMinhas, metaItem),
    [hojeIso, tasksMinhas, linhasMesMinhas, leadsMinhas, metaItem]
  );

  const totalAtencaoMeus = itensAtencaoMeus.length;
  const atrasadosMeus = itensAtencaoMeus.filter((i) => i.diasAtraso > 0).length;

  const itensVisiveisBase = escopo === "meus" ? itensAtencaoMeus : itensAtencaoEquipe;
  const contagemPorCategoria = useMemo(() => {
    const mapa: Record<string, number> = { Tudo: itensVisiveisBase.length };
    for (const cat of CATEGORIAS_ATENCAO) mapa[cat] = itensVisiveisBase.filter((i) => i.categoria === cat).length;
    return mapa;
  }, [itensVisiveisBase]);
  const itensVisiveis = categoriaFiltro === "Tudo" ? itensVisiveisBase : itensVisiveisBase.filter((i) => i.categoria === categoriaFiltro);

  const obrigacoesConcluidasMes = linhasMes.filter((l) => !l.pendente).length;
  const obrigacoesUrgentes = linhasMes.filter((l) => l.pendente && l.vencimento && l.vencimento <= hojeIso).length;
  const tarefasMinhasAtrasadas = tasksMinhas.filter((t) => daysFromToday(t.prazo) < 0).length;
  const pctMeta = Math.round((fechadosNoMes / Math.max(metaMensalClientes, 1)) * 100);
  const valorPipeline = leadsAtivos.reduce((a, l) => a + l.valorEstimado, 0);

  const processosEmAndamento = processosSocietarios.filter((p) => p.status !== "Finalizado").length;
  const passosMeusPendentes = processosSocietarios
    .flatMap((p) => p.etapas ?? [])
    .filter((e) => e.responsavelId === userId && (e.status === "Pendente" || e.status === "Em andamento")).length;

  const dataFormatada = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const primeiroNome = me?.nome.split(" ")[0] ?? "bem-vindo";

  return (
    <div>
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-wine-900 via-wine-800 to-wine-700 px-6 py-6 text-cream-50 shadow-sm">
        <p className="text-xs font-medium capitalize text-cream-50/70">{dataFormatada}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
          {saudacaoPorHora()}, {primeiroNome}
        </h1>
        <p className="mt-2 text-sm text-cream-50/80">
          {totalAtencaoMeus === 0
            ? "Nada pedindo atenção hoje — tudo em dia 🎉"
            : `Você tem ${totalAtencaoMeus} ${totalAtencaoMeus === 1 ? "item pedindo" : "itens pedindo"} atenção hoje${
                atrasadosMeus > 0 ? `, sendo ${atrasadosMeus} ${atrasadosMeus === 1 ? "atrasado" : "atrasados"}.` : "."
              }`}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Obrigações urgentes"
          value={obrigacoesUrgentes}
          hint={`${obrigacoesConcluidasMes} de ${linhasMes.length} concluídas no mês`}
          icon={AlertOctagon}
          tone="danger"
          onClick={() => router.push("/obrigacoes")}
        />
        <MetricCard
          label="Tarefas em aberto"
          value={tasksAbertas.length}
          hint={`${tasksMinhas.length} suas · ${tarefasMinhasAtrasadas} atrasadas`}
          icon={ListTodo}
          tone="wine"
          onClick={() => router.push("/tarefas")}
        />
        <MetricCard
          label="Progresso das metas"
          value={`${pctMeta}%`}
          hint={`${fechadosNoMes} de ${metaMensalClientes} clientes fechados`}
          icon={Target}
          tone={pctMeta >= 100 ? "success" : "warning"}
          onClick={() => router.push("/comercial")}
        />
        <MetricCard
          label="Leads em andamento"
          value={leadsAtivos.length}
          hint={`${formatCurrency(valorPipeline)} em potencial`}
          icon={Handshake}
          tone="neutral"
          onClick={() => router.push("/comercial")}
        />
        <MetricCard
          label="Processos de legalização"
          value={processosEmAndamento}
          hint={`${passosMeusPendentes} passo${passosMeusPendentes === 1 ? "" : "s"} seu${passosMeusPendentes === 1 ? "" : "s"} pendente${passosMeusPendentes === 1 ? "" : "s"}`}
          icon={Scale}
          tone="wine"
          onClick={() => router.push("/societario")}
        />
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-sm font-semibold text-sand-900">Precisa de atenção</h2>
              <p className="text-[11px] text-sand-500">O que está sob a sua responsabilidade, do mais urgente ao mais tranquilo.</p>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-sand-200 text-[11px]">
              <button
                type="button"
                onClick={() => setEscopo("meus")}
                className={cn("px-3 py-1.5 font-medium", escopo === "meus" ? "bg-wine-700 text-cream-50" : "bg-white text-sand-600 hover:bg-sand-50")}
              >
                Meus
              </button>
              <button
                type="button"
                onClick={() => setEscopo("equipe")}
                className={cn("px-3 py-1.5 font-medium", escopo === "equipe" ? "bg-wine-700 text-cream-50" : "bg-white text-sand-600 hover:bg-sand-50")}
              >
                Equipe
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["Tudo", ...CATEGORIAS_ATENCAO] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaFiltro(cat)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  categoriaFiltro === cat ? "border-wine-600 bg-wine-700 text-cream-50" : "border-sand-300 bg-white text-sand-600 hover:bg-sand-100"
                )}
              >
                {cat} ({contagemPorCategoria[cat] ?? 0})
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {itensVisiveis.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-sand-200 px-3 py-2.5 hover:bg-sand-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-sand-900">{item.titulo}</span>
                  <span className="block truncate text-[11px] text-sand-500">{item.contexto}</span>
                </span>
                <Badge variant={item.diasAtraso > 0 ? "danger" : "warning"} className="shrink-0 whitespace-nowrap">
                  {item.rotulo ?? (item.diasAtraso > 0 ? `atrasada há ${item.diasAtraso} dia${item.diasAtraso === 1 ? "" : "s"}` : "vence hoje")}
                </Badge>
              </Link>
            ))}
            {itensVisiveis.length === 0 && <p className="py-6 text-center text-xs text-sand-400">Nada pendente por aqui — tudo em dia.</p>}
          </div>
        </CardContent>
      </Card>

      {podeVerFinanceiro && (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="size-4 text-wine-600" /> Relatório financeiro — {MESES_NOME[new Date().getMonth()]}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
          <MetricCard label="Recebido" value={formatCurrency(relatorioMensal.recebidoMes)} icon={CircleDollarSign} tone="success" />
          <MetricCard label="Pago" value={formatCurrency(relatorioMensal.pagoMes)} icon={TrendingDown} tone="danger" />
          <MetricCard
            label="Lucro"
            value={formatCurrency(relatorioMensal.lucroMes)}
            icon={PiggyBank}
            tone={relatorioMensal.lucroMes >= 0 ? "success" : "danger"}
          />
        </CardContent>
      </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Clientes ativos" value={metrics.ativos} icon={UserCheck} tone="success" />
        <MetricCard label="Em onboarding" value={metrics.onboarding} icon={UserPlus} tone="wine" />
        <MetricCard label="Suspensos" value={metrics.suspensos} icon={UserX} tone="danger" />
        <MetricCard label="Inadimplentes" value={metrics.inadimplentes} icon={CircleAlert} tone="warning" />
        <MetricCard label="Em saída" value={metrics.saida} icon={UserLeaving} tone="neutral" />
      </div>

      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-sand-700">Detalhamento por período</h2>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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

        {podeVerFinanceiro && (
        <SectionCard title="Financeiro">
          <MetricCard label="Honorários previstos" value={formatCurrency(metrics.honorariosPrevistos)} icon={Wallet} />
          <MetricCard label="Recebido" value={formatCurrency(metrics.recebidos)} icon={CircleDollarSign} tone="success" />
          <MetricCard label="Em aberto" value={formatCurrency(metrics.emAberto)} icon={Wallet} tone="warning" />
          <MetricCard label="Inadimplência" value={formatCurrency(metrics.inadimplencia)} icon={CircleAlert} tone="danger" />
          <MetricCard label="MRR" value={formatCurrency(metrics.honorariosPrevistos)} icon={Repeat} tone="wine" />
        </SectionCard>
        )}

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
