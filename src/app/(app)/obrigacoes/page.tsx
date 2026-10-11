"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus, Search, Pencil, Trash2, AlertTriangle, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info, CheckCheck, RotateCcw, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ObligationFormDialog } from "@/components/obligations/obligation-form-dialog";
import { useAppStore } from "@/lib/store/app-store";
import { teamName } from "@/lib/team-lookup";
import { rotinasDepartamentosDoMes, regraVencimentoRotina, type RotinaDepartamento, type SetorRotina } from "@/lib/obrigacoes-departamentos";
import { CHECKLIST_STATUS, OBLIGATION_STATUS, type Obligation, type ChecklistStatus } from "@/lib/types";
import type { BadgeTone } from "@/lib/status";
import { formatDate, cn } from "@/lib/utils";

const PENDENTES_MANUAL: Obligation["status"][] = ["A fazer", "Em andamento", "Aguardando informação", "Em atraso"];
const PENDENTES_DEPTO: ChecklistStatus[] = ["Pendente", "Em andamento"];

const MESES = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];
const SETOR_STYLE: Record<SetorRotina | "Manual", BadgeTone> = {
  Fiscal: "wine",
  Contábil: "info",
  "Departamento Pessoal": "cream",
  MEI: "outline",
  Manual: "neutral",
};

type Linha =
  | { kind: "manual"; id: string; clienteId: string; tipo: string; setor: "Manual"; vencimento: string; responsavelId: string; status: string; pendente: boolean; obligation: Obligation }
  | { kind: "departamento"; id: string; clienteId: string; tipo: string; setor: SetorRotina; vencimento: string | null; responsavelId: null; status: string; pendente: boolean; rotina: RotinaDepartamento };

export default function ObrigacoesPage() {
  const obligations = useAppStore((s) => s.obligations);
  const clients = useAppStore((s) => s.clients);
  const checklistFiscal = useAppStore((s) => s.checklistFiscal);
  const checklistContabil = useAppStore((s) => s.checklistContabil);
  const checklistPessoal = useAppStore((s) => s.checklistPessoal);
  const checklistMei = useAppStore((s) => s.checklistMei);
  const dispensasRotina = useAppStore((s) => s.dispensasRotina);
  const addDispensaRotina = useAppStore((s) => s.addDispensaRotina);
  const updateObligation = useAppStore((s) => s.updateObligation);
  const deleteObligation = useAppStore((s) => s.deleteObligation);
  const setChecklistFiscal = useAppStore((s) => s.setChecklistFiscal);
  const setChecklistContabil = useAppStore((s) => s.setChecklistContabil);
  const setChecklistPessoal = useAppStore((s) => s.setChecklistPessoal);
  const setChecklistMei = useAppStore((s) => s.setChecklistMei);

  const hoje = new Date();
  const hojeMeiaNoite = new Date(hoje).setHours(0, 0, 0, 0);
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [mes, setMes] = useState(String(hoje.getMonth() + 1).padStart(2, "0"));
  const [query, setQuery] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("Todos");
  const [statusFiltro, setStatusFiltro] = useState<"Pendentes" | "Concluídas" | "Todas">("Pendentes");
  const [ordenar, setOrdenar] = useState<"cliente" | "vencimento" | "setor" | "status">("cliente");
  const [visao, setVisao] = useState<"lista" | "calendario">("lista");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Obligation | null>(null);
  const [detalheTipo, setDetalheTipo] = useState<string | null>(null);
  const [buscaDetalhe, setBuscaDetalhe] = useState("");
  const [selecionadosDetalhe, setSelecionadosDetalhe] = useState<Set<string>>(new Set());

  const competencia = `${ano}-${mes}`;
  const hojeIso = hoje.toISOString().slice(0, 10);

  const rotinasDepto = useMemo(
    () => rotinasDepartamentosDoMes(clients, checklistFiscal, checklistContabil, checklistPessoal, checklistMei, competencia, dispensasRotina),
    [clients, checklistFiscal, checklistContabil, checklistPessoal, checklistMei, competencia, dispensasRotina]
  );

  function abrirNova() {
    setEditing(null);
    setFormOpen(true);
  }
  function abrirEdicao(o: Obligation) {
    setEditing(o);
    setFormOpen(true);
  }
  function excluir(o: Obligation) {
    if (confirm(`Excluir a obrigação "${o.tipo}"?`)) deleteObligation(o.id);
  }

  function mudarMes(delta: number) {
    const d = new Date(Number(ano), Number(mes) - 1 + delta, 1);
    setAno(String(d.getFullYear()));
    setMes(String(d.getMonth() + 1).padStart(2, "0"));
  }

  function setStatusChecklist(setor: SetorRotina, clienteId: string, comp: string, rotina: string, status: ChecklistStatus) {
    if (setor === "Fiscal") setChecklistFiscal(clienteId, comp, rotina, status);
    else if (setor === "Contábil") setChecklistContabil(clienteId, comp, rotina, status);
    else if (setor === "Departamento Pessoal") setChecklistPessoal(clienteId, comp, rotina, status);
    else setChecklistMei(clienteId, comp, rotina, status);
  }

  /** Corrige quem já foi marcado como "Dispensada" num mês específico antes
   * de existir a dispensa permanente — sem isso, quem ela já tinha marcado
   * em janeiro, por exemplo, não teve a marcação repetida sozinha nos meses
   * seguintes. Varre os 4 checklists inteiros (todas as competências) e
   * cria a dispensa permanente pra cada combinação cliente+rotina que ainda
   * não tem uma, sem duplicar quem já tem. */
  async function aplicarDispensasRetroativas() {
    const checklistsPorSetor: { setor: SetorRotina; entries: typeof checklistFiscal }[] = [
      { setor: "Fiscal", entries: checklistFiscal },
      { setor: "Contábil", entries: checklistContabil },
      { setor: "Departamento Pessoal", entries: checklistPessoal },
      { setor: "MEI", entries: checklistMei },
    ];
    const jaDispensado = new Set(dispensasRotina.map((d) => `${d.clienteId}__${d.setor}__${d.rotina}`));
    const novas: { clienteId: string; setor: SetorRotina; rotina: string }[] = [];
    const vistos = new Set<string>();
    for (const { setor, entries } of checklistsPorSetor) {
      for (const e of entries) {
        if (e.status !== "Dispensada") continue;
        const chave = `${e.clienteId}__${setor}__${e.rotina}`;
        if (jaDispensado.has(chave) || vistos.has(chave)) continue;
        vistos.add(chave);
        novas.push({ clienteId: e.clienteId, setor, rotina: e.rotina });
      }
    }
    if (novas.length === 0) {
      alert("Nenhuma dispensa nova pra aplicar — tudo que já está marcado como Dispensada já tem a dispensa permanente.");
      return;
    }
    if (
      !confirm(
        `Encontrei ${novas.length} combinação(ões) de cliente + rotina já marcadas como "Dispensada" em algum mês, mas sem a dispensa permanente. Aplicar a dispensa permanente pra elas agora? Isso faz essas rotinas aparecerem como "Dispensada" em todo mês sem marcação própria, inclusive nos meses futuros.`
      )
    )
      return;
    // Disparar uma gravação por combinação de uma vez só passa do limite de
    // requisições simultâneas do navegador quando são muitas (ex: centenas
    // de clientes × rotinas) e algumas falham com "Failed to fetch" — mesmo
    // problema já visto nas cópias em lote do checklist. Aplica em lotes
    // pequenos, com uma pausa entre eles.
    const TAMANHO_LOTE = 15;
    for (let i = 0; i < novas.length; i += TAMANHO_LOTE) {
      for (const { clienteId, setor, rotina } of novas.slice(i, i + TAMANHO_LOTE)) {
        addDispensaRotina({ id: `disp-${clienteId}-${setor}-${rotina}`, clienteId, setor, rotina });
      }
      if (i + TAMANHO_LOTE < novas.length) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    alert(`Pronto — ${novas.length} dispensa(s) permanente(s) aplicada(s).`);
  }

  function abrirDetalhe(tipo: string) {
    setDetalheTipo(tipo);
    setBuscaDetalhe("");
    setSelecionadosDetalhe(new Set());
  }

  function toggleSelecionadoDetalhe(id: string) {
    setSelecionadosDetalhe((atual) => {
      const next = new Set(atual);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const linhas = useMemo<Linha[]>(() => {
    const manuais: Linha[] = obligations
      .filter((o) => o.competencia === competencia)
      .map((o) => ({
        kind: "manual",
        id: o.id,
        clienteId: o.clienteId,
        tipo: o.tipo,
        setor: "Manual",
        vencimento: o.vencimento,
        responsavelId: o.responsavelId,
        status: o.status,
        pendente: PENDENTES_MANUAL.includes(o.status),
        obligation: o,
      }));
    const departamentos: Linha[] = rotinasDepto.map((r) => ({
      kind: "departamento",
      id: r.id,
      clienteId: r.clienteId,
      tipo: r.tipo,
      setor: r.setor,
      vencimento: r.vencimento ?? null,
      responsavelId: null,
      status: r.status,
      pendente: PENDENTES_DEPTO.includes(r.status),
      rotina: r,
    }));
    return [...manuais, ...departamentos];
  }, [obligations, rotinasDepto, competencia]);

  function marcarSelecionadosDetalhe(concluido: boolean) {
    for (const l of linhas) {
      if (!selecionadosDetalhe.has(l.id)) continue;
      if (l.kind === "manual") updateObligation(l.id, { status: concluido ? "Concluído" : "A fazer" });
      else setStatusChecklist(l.setor, l.clienteId, competencia, l.tipo, concluido ? "OK" : "Pendente");
    }
    setSelecionadosDetalhe(new Set());
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return linhas
      .map((l) => ({ linha: l, cliente: clients.find((c) => c.id === l.clienteId) }))
      .filter(({ linha: l, cliente }) => {
        const nomeCliente = cliente?.dados.razaoSocial ?? "";
        const matchesQuery = q === "" || l.tipo.toLowerCase().includes(q) || nomeCliente.toLowerCase().includes(q);
        const matchesCliente = clienteFiltro === "Todos" || l.clienteId === clienteFiltro;
        const matchesStatus = statusFiltro === "Todas" ? true : statusFiltro === "Pendentes" ? l.pendente : !l.pendente;
        return matchesQuery && matchesCliente && matchesStatus;
      })
      .sort((a, b) => {
        const an = a.cliente?.dados.razaoSocial ?? "";
        const bn = b.cliente?.dados.razaoSocial ?? "";
        const nomeCliente = () => an.localeCompare(bn, "pt-BR") || a.linha.tipo.localeCompare(b.linha.tipo, "pt-BR");
        switch (ordenar) {
          case "vencimento":
            if (!a.linha.vencimento && !b.linha.vencimento) return nomeCliente();
            if (!a.linha.vencimento) return 1;
            if (!b.linha.vencimento) return -1;
            return a.linha.vencimento.localeCompare(b.linha.vencimento) || nomeCliente();
          case "setor":
            return a.linha.setor.localeCompare(b.linha.setor, "pt-BR") || nomeCliente();
          case "status":
            return a.linha.status.localeCompare(b.linha.status, "pt-BR") || nomeCliente();
          default:
            return nomeCliente();
        }
      });
  }, [linhas, clients, query, clienteFiltro, statusFiltro, ordenar]);

  // Visão calendário: entram as obrigações avulsas e as rotinas de
  // departamento com regra de vencimento conhecida (ver
  // REGRAS_VENCIMENTO_ROTINA) — organizadas por dia do mês selecionado.
  // Respeita os mesmos filtros de busca/cliente/status da lista.
  const semanas = useMemo(() => {
    const ano_ = Number(ano);
    const mesIdx = Number(mes) - 1;
    const porDia = new Map<string, typeof filtered>();
    for (const item of filtered) {
      if (!item.linha.vencimento) continue;
      const atual = porDia.get(item.linha.vencimento) ?? [];
      atual.push(item);
      porDia.set(item.linha.vencimento, atual);
    }
    const primeiroDiaSemana = new Date(ano_, mesIdx, 1).getDay();
    const totalDias = new Date(ano_, mesIdx + 1, 0).getDate();
    const celulas: ({ dia: number; iso: string; itens: typeof filtered } | null)[] = [];
    for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
    for (let dia = 1; dia <= totalDias; dia++) {
      const iso = `${ano}-${mes}-${String(dia).padStart(2, "0")}`;
      celulas.push({ dia, iso, itens: porDia.get(iso) ?? [] });
    }
    while (celulas.length % 7 !== 0) celulas.push(null);
    const semanas_: typeof celulas[] = [];
    for (let i = 0; i < celulas.length; i += 7) semanas_.push(celulas.slice(i, i + 7));
    return semanas_;
  }, [filtered, ano, mes]);

  const totalPendentes = linhas.filter((l) => l.pendente).length;
  const totalAtrasadas = linhas.filter((l) => l.pendente && l.vencimento && l.vencimento < hojeIso).length;

  // "Ciclo do mês": visão geral de tudo que esse mês exige (rotinas de
  // departamento + obrigações avulsas), igual um placar de progresso.
  const totalRotinas = linhas.length;
  const totalConcluidas = linhas.filter((l) => !l.pendente).length;
  const totalVencemHoje = linhas.filter((l) => l.pendente && l.vencimento === hojeIso).length;
  const progressoGeral = totalRotinas > 0 ? Math.round((totalConcluidas / totalRotinas) * 100) : 0;

  // "Próximos prazos": obrigações avulsas e rotinas de departamento com
  // regra de vencimento conhecida — agrupadas por tipo pra mostrar quantos
  // clientes já concluíram cada uma.
  const proximosPrazos = useMemo(() => {
    const porTipo = new Map<string, { tipo: string; total: number; concluidas: number; menorVencimentoPendente: string | null }>();
    for (const l of linhas) {
      if (l.kind === "departamento" && !l.vencimento) continue;
      const atual = porTipo.get(l.tipo) ?? { tipo: l.tipo, total: 0, concluidas: 0, menorVencimentoPendente: null };
      atual.total += 1;
      if (!l.pendente) atual.concluidas += 1;
      else if (l.vencimento && (!atual.menorVencimentoPendente || l.vencimento < atual.menorVencimentoPendente)) {
        atual.menorVencimentoPendente = l.vencimento;
      }
      porTipo.set(l.tipo, atual);
    }
    return [...porTipo.values()]
      .filter((g) => g.menorVencimentoPendente !== null)
      .sort((a, b) => a.menorVencimentoPendente!.localeCompare(b.menorVencimentoPendente!))
      .slice(0, 12);
  }, [linhas]);

  // Agrupa os cards de "Próximos prazos" por data (um cabeçalho por data
  // compartilhada), já que a lista vem ordenada por vencimento crescente.
  const prazosPorData = useMemo(() => {
    const grupos: { data: string; itens: typeof proximosPrazos }[] = [];
    for (const g of proximosPrazos) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.data === g.menorVencimentoPendente) ultimo.itens.push(g);
      else grupos.push({ data: g.menorVencimentoPendente!, itens: [g] });
    }
    return grupos;
  }, [proximosPrazos]);

  // Linhas (uma por cliente) mostradas no detalhe de uma obrigação — aberto
  // ao clicar num card de "Próximos prazos". Respeita a busca própria do
  // diálogo, não a busca/filtros da lista principal.
  const linhasDetalhe = useMemo(() => {
    if (!detalheTipo) return [];
    const q = buscaDetalhe.trim().toLowerCase();
    return linhas
      .filter((l) => l.tipo === detalheTipo)
      .map((l) => ({ linha: l, cliente: clients.find((c) => c.id === l.clienteId) }))
      .filter(({ cliente }) => {
        if (!q) return true;
        const nome = cliente?.dados.razaoSocial.toLowerCase() ?? "";
        return nome.includes(q) || (cliente?.dados.cnpj ?? "").includes(q);
      })
      .sort((a, b) => (a.cliente?.dados.razaoSocial ?? "").localeCompare(b.cliente?.dados.razaoSocial ?? "", "pt-BR"));
  }, [linhas, detalheTipo, clients, buscaDetalhe]);

  const detalheConcluidas = linhasDetalhe.filter(({ linha: l }) => !l.pendente).length;
  const detalheRegra = detalheTipo ? regraVencimentoRotina(detalheTipo) : undefined;
  const todosSelecionadosDetalhe = linhasDetalhe.length > 0 && linhasDetalhe.every(({ linha: l }) => selecionadosDetalhe.has(l.id));

  return (
    <div>
      <PageHeader
        title="Obrigações"
        description="Visão geral do que está pendente de cada cliente — junta as rotinas de Fiscal, Contábil, Departamento Pessoal e MEI com obrigações avulsas."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={aplicarDispensasRetroativas}>
              <Wand2 className="size-3.5" /> Aplicar dispensas já marcadas
            </Button>
            <Button onClick={abrirNova}><Plus className="size-3.5" /> Nova obrigação</Button>
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-sand-400">Ciclo do mês</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-sand-700"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="w-36 text-center font-display text-sm font-semibold text-sand-900">
            {MESES.find((m) => m.value === mes)?.label} {ano}
          </span>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-sand-700"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Rotinas no mês", value: totalRotinas, className: "border-sand-800 bg-sand-900" },
          { label: "Concluídas", value: totalConcluidas, className: "border-status-success bg-status-success" },
          { label: "Vencem hoje", value: totalVencemHoje, className: "border-status-danger bg-status-danger" },
          { label: "Fora do prazo", value: totalAtrasadas, className: "border-status-info bg-status-info" },
          { label: "Progresso geral", value: `${progressoGeral}%`, className: "border-sand-800 bg-sand-900" },
        ].map(({ label, value, className }) => (
          <Card key={label} className={cn("py-0", className)}>
            <CardContent className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-cream-50/70">{label}</p>
              <p className="mt-2 font-display text-2xl font-semibold text-cream-50">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {prazosPorData.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-sand-400">Próximos prazos</p>
            <div className="flex items-center gap-3 text-[11px] text-sand-500">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-status-success" /> Em dia</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-status-warning" /> Urgente</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-status-danger" /> Atrasado</span>
            </div>
          </div>
          <div className="space-y-4">
            {prazosPorData.map(({ data, itens }) => {
              const venc = new Date(data + "T00:00:00");
              const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
              return (
                <div key={data}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full border border-sand-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-sand-600">
                      {DIAS_SEMANA[venc.getDay()]} {venc.getDate()}
                    </span>
                    <div className="h-px flex-1 bg-sand-200" />
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {itens.map((g) => {
                      const dias = Math.round((venc.getTime() - hojeMeiaNoite) / 86400000);
                      const atrasado = dias < 0;
                      const urgente = !atrasado && dias <= 3;
                      const paleta = atrasado
                        ? { anel: "border-status-danger text-status-danger", pill: "border-status-danger text-status-danger", label: "ATRASADO" }
                        : urgente
                          ? { anel: "border-status-warning text-status-warning", pill: "border-status-warning text-status-warning", label: "URGENTE" }
                          : { anel: "border-status-info text-status-info", pill: "border-status-info text-status-info", label: "ABERTO" };
                      return (
                        <Card
                          key={g.tipo}
                          className="w-56 shrink-0 cursor-pointer py-0 transition-shadow hover:shadow-md"
                          onClick={() => abrirDetalhe(g.tipo)}
                        >
                          <CardContent className="flex min-w-0 flex-col items-center gap-1.5 p-3 text-center">
                            <div className={cn("flex size-14 shrink-0 flex-col items-center justify-center gap-0 rounded-full border-2 leading-none", paleta.anel)}>
                              <span className="text-[9px] font-semibold">{DIAS_SEMANA[venc.getDay()]}</span>
                              <span className="text-lg font-bold">{venc.getDate()}</span>
                            </div>
                            <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide", paleta.pill)}>
                              {paleta.label}
                            </span>
                            <p className="w-full truncate font-medium text-sand-900" title={g.tipo}>{g.tipo}</p>
                            <p className="w-full truncate text-[11px] text-sand-400">
                              Competência {MESES.find((m) => m.value === mes)?.label}/{ano}
                            </p>
                            <p className="w-full truncate text-[11px]">
                              <span className="font-semibold text-status-success">{g.concluidas} concluídas</span>
                              <span className="text-sand-400"> · </span>
                              <span className="font-semibold text-status-danger">{g.total - g.concluidas} pendentes</span>
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <span className="rounded-full bg-status-warning-bg px-3 py-1 font-medium text-status-warning">
          {totalPendentes} pendente{totalPendentes === 1 ? "" : "s"}
        </span>
        {totalAtrasadas > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-status-danger-bg px-3 py-1 font-medium text-status-danger">
            <AlertTriangle className="size-3" /> {totalAtrasadas} em atraso
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
          <Input placeholder="Buscar obrigação ou cliente" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os clientes</SelectItem>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.dados.razaoSocial}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as typeof statusFiltro)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Pendentes">Pendentes</SelectItem>
            <SelectItem value="Concluídas">Concluídas</SelectItem>
            <SelectItem value="Todas">Todos os status</SelectItem>
          </SelectContent>
        </Select>
        {visao === "lista" && (
          <Select value={ordenar} onValueChange={(v) => setOrdenar(v as typeof ordenar)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cliente">Ordenar: Cliente (A-Z)</SelectItem>
              <SelectItem value="vencimento">Ordenar: Vencimento</SelectItem>
              <SelectItem value="setor">Ordenar: Setor</SelectItem>
              <SelectItem value="status">Ordenar: Status</SelectItem>
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-sand-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setVisao("lista")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              visao === "lista" ? "bg-wine-700 text-cream-50" : "text-sand-500 hover:bg-sand-100"
            )}
          >
            <List className="size-3.5" /> Lista
          </button>
          <button
            type="button"
            onClick={() => setVisao("calendario")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              visao === "calendario" ? "bg-wine-700 text-cream-50" : "text-sand-500 hover:bg-sand-100"
            )}
          >
            <CalendarIcon className="size-3.5" /> Calendário
          </button>
        </div>
      </div>

      {visao === "calendario" ? (
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-sand-400">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (<div key={d}>{d}</div>))}
            </div>
            <div className="mt-1.5 space-y-1.5">
              {semanas.map((semana, i) => (
                <div key={i} className="grid grid-cols-7 gap-1.5">
                  {semana.map((cel, j) =>
                    cel ? (
                      <div
                        key={cel.iso}
                        className={cn(
                          "min-h-20 rounded-lg border p-1.5",
                          cel.iso === hojeIso ? "border-wine-400 bg-wine-50" : "border-sand-200 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <p className={cn("text-[11px] font-semibold", cel.iso === hojeIso ? "text-wine-700" : "text-sand-500")}>{cel.dia}</p>
                          {cel.itens.length > 0 && (
                            <span className="flex size-4 items-center justify-center rounded bg-sand-100 text-[9px] font-semibold text-sand-500">
                              {cel.itens.length}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 space-y-1">
                          {cel.itens.slice(0, 3).map(({ linha: l, cliente }) => {
                            const concluida = !l.pendente;
                            const atrasada = l.pendente && l.vencimento! < hojeIso;
                            return (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => l.kind === "manual" && abrirEdicao(l.obligation)}
                                title={`${l.tipo} — ${cliente?.dados.razaoSocial ?? ""}`}
                                className={cn(
                                  "block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-semibold text-cream-50 shadow-sm",
                                  concluida ? "bg-status-success" : atrasada ? "bg-status-danger" : "bg-wine-600"
                                )}
                              >
                                {l.tipo}
                              </button>
                            );
                          })}
                          {cel.itens.length > 3 && (
                            <p className="px-1 text-[10px] text-sand-400">+{cel.itens.length - 3}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div key={`vazio-${i}-${j}`} />
                    )
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Obrigação</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(({ linha: l, cliente }) => {
            const atrasada = l.vencimento !== null && l.vencimento < hojeIso && l.pendente;
            return (
              <TableRow key={l.id}>
                <TableCell>
                  {cliente ? (
                    <Link href={`/clientes/${cliente.id}`} className="font-medium text-sand-900 hover:text-wine-700 hover:underline">
                      {cliente.dados.razaoSocial}
                    </Link>
                  ) : (
                    <span className="text-sand-400">—</span>
                  )}
                </TableCell>
                <TableCell className="flex items-center gap-2 font-medium text-sand-900">
                  <CalendarClock className="size-3.5 shrink-0 text-wine-500" /> {l.tipo}
                </TableCell>
                <TableCell><Badge variant={SETOR_STYLE[l.setor]}>{l.setor}</Badge></TableCell>
                <TableCell className={cn(atrasada && "font-semibold text-status-danger")}>
                  {l.vencimento ? formatDate(l.vencimento) : "—"}
                </TableCell>
                <TableCell>{l.responsavelId ? teamName(l.responsavelId) : "—"}</TableCell>
                <TableCell>
                  {l.kind === "manual" ? (
                    <Select value={l.status} onValueChange={(v) => updateObligation(l.id, { status: v as Obligation["status"] })}>
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OBLIGATION_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={l.status}
                      onValueChange={(v) => setStatusChecklist(l.setor, l.clienteId, competencia, l.tipo, v as ChecklistStatus)}
                    >
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHECKLIST_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {l.kind === "manual" && (
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(l.obligation)}
                        className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-sand-100 hover:text-wine-700"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => excluir(l.obligation)}
                        className="flex size-7 items-center justify-center rounded-md text-sand-400 hover:bg-status-danger-bg hover:text-status-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-sand-400">Nenhuma obrigação encontrada.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      )}

      <ObligationFormDialog open={formOpen} onOpenChange={setFormOpen} obligation={editing} />

      <Dialog open={!!detalheTipo} onOpenChange={(open) => !open && setDetalheTipo(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detalheTipo}</DialogTitle>
          </DialogHeader>

          <div className="rounded-lg border border-wine-200 bg-wine-50 p-3 text-xs text-wine-800">
            <p className="mb-1 flex items-center gap-1.5 font-medium">
              <Info className="size-3.5 shrink-0" /> Informações da obrigação
            </p>
            {detalheRegra ? (
              <p>
                Vencimento todo dia <strong>{detalheRegra.dia}</strong> — {detalheRegra.descricaoAjuste}
              </p>
            ) : (
              <p>Obrigação avulsa cadastrada manualmente — o vencimento vem do cadastro, sem regra automática.</p>
            )}
            <p className="mt-1 text-wine-700/70">
              Competência {MESES.find((m) => m.value === mes)?.label}/{ano} · {detalheConcluidas}/{linhasDetalhe.length} clientes concluídos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sand-400" />
              <Input
                value={buscaDetalhe}
                onChange={(e) => setBuscaDetalhe(e.target.value)}
                placeholder="Buscar por razão social ou CNPJ"
                className="pl-8"
              />
            </div>
            {linhasDetalhe.some(({ linha: l }) => l.pendente) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelecionadosDetalhe(new Set(linhasDetalhe.filter(({ linha: l }) => l.pendente).map(({ linha: l }) => l.id)))}
              >
                Selecionar só pendentes
              </Button>
            )}
            {selecionadosDetalhe.size > 0 && (
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => marcarSelecionadosDetalhe(true)}>
                  <CheckCheck className="size-3.5" /> Marcar {selecionadosDetalhe.size} como concluído
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => marcarSelecionadosDetalhe(false)}>
                  <RotateCcw className="size-3.5" /> Marcar como pendente
                </Button>
              </>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-9">
                  {linhasDetalhe.length > 0 && (
                    <Checkbox
                      checked={todosSelecionadosDetalhe}
                      onCheckedChange={() =>
                        setSelecionadosDetalhe(
                          todosSelecionadosDetalhe ? new Set() : new Set(linhasDetalhe.map(({ linha: l }) => l.id))
                        )
                      }
                    />
                  )}
                </TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhasDetalhe.map(({ linha: l, cliente }) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Checkbox checked={selecionadosDetalhe.has(l.id)} onCheckedChange={() => toggleSelecionadoDetalhe(l.id)} />
                  </TableCell>
                  <TableCell>
                    {cliente ? (
                      <Link href={`/clientes/${cliente.id}`} className="font-medium text-sand-900 hover:text-wine-700 hover:underline">
                        {cliente.dados.razaoSocial}
                      </Link>
                    ) : (
                      <span className="text-sand-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sand-500">{cliente?.dados.cnpj ?? "—"}</TableCell>
                  <TableCell>
                    {l.kind === "manual" ? (
                      <Select value={l.status} onValueChange={(v) => updateObligation(l.id, { status: v as Obligation["status"] })}>
                        <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OBLIGATION_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select
                        value={l.status}
                        onValueChange={(v) => setStatusChecklist(l.setor, l.clienteId, competencia, l.tipo, v as ChecklistStatus)}
                      >
                        <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CHECKLIST_STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {linhasDetalhe.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-8 text-center text-sand-400">Nenhum cliente encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
