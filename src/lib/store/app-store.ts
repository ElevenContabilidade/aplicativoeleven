"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  TEAM,
  LEADS,
  CLIENTS,
  TASKS,
  OBLIGATIONS,
  PROCESSOS_SOCIETARIOS,
  CERTIFICADOS,
  DOCUMENTOS,
  ANOTACOES,
  TIMELINE,
  NOTIFICATIONS,
  SERVICOS_EXTRAS,
  LICENCAS,
  INDICACOES,
  SERVICOS_PORTFOLIO,
  PARCELAMENTOS,
  ENVIOS_PARCELAMENTO,
} from "@/lib/data/seed";
import { syncLicencaAlerts } from "@/lib/licenca-alerts";
import { syncCertificadoAlerts } from "@/lib/certificado-alerts";
import { syncFiscalAlerts } from "@/lib/fiscal-alerts";
import { syncDocumentoAlerts } from "@/lib/documento-alerts";
import { ETAPAS_ABERTURA_EMPRESA, ONBOARDING_TEMPLATE } from "@/lib/types";
import { useAuthStore } from "@/lib/store/auth-store";
import { createClient } from "@/lib/supabase/client";
import { parsePermissaoKey } from "@/lib/permissoes";

/** Nome de quem está logado no momento, para registrar no histórico de
 * ações do colaborador (quem criou/editou o quê). */
function autorAtual(team: TeamMember[]): string {
  const { kind, userId, email } = useAuthStore.getState();
  if (kind === "equipe" && userId) {
    const m = team.find((t) => t.id === userId);
    if (m) return m.nome;
  }
  return email ?? "Sistema";
}

function novaHistoricoEntry(team: TeamMember[], acao: string): HistoricoAcaoUsuario {
  return { id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, acao, autor: autorAtual(team), data: new Date().toISOString() };
}

/** Clientes e Financeiro (Etapa 3 da migração) ficam numa tabela genérica
 * no Supabase — cada linha guarda um item inteiro (cliente, recebimento,
 * boleto etc.) como JSON, marcado por `tipo`. Evita ter que desenhar e
 * manter uma tabela relacional própria pra cada um dos ~9 tipos de dado
 * financeiro, que têm formato bem diferente entre si. */
function pushFinanceiro(tipo: string, id: string, clienteId: string | null, data: unknown) {
  void createClient()
    .from("dados_financeiros")
    .upsert({ tipo, id, cliente_id: clienteId, data }, { onConflict: "tipo,id" })
    .then(({ error }) => error && console.error(`Erro ao salvar dado financeiro (${tipo}):`, error.message));
}
function deleteFinanceiro(tipo: string, id: string) {
  void createClient()
    .from("dados_financeiros")
    .delete()
    .eq("tipo", tipo)
    .eq("id", id)
    .then(({ error }) => error && console.error(`Erro ao excluir dado financeiro (${tipo}):`, error.message));
}
/** Some com a linha do cliente e com tudo que referencia esse cliente
 * (boletos, notas fiscais mensais, recebimentos de parceiro). */
function deleteFinanceiroPorCliente(clienteId: string) {
  void createClient()
    .from("dados_financeiros")
    .delete()
    .eq("cliente_id", clienteId)
    .then(({ error }) => error && console.error("Erro ao excluir dados financeiros do cliente:", error.message));
}
/** Reflete no Supabase a mudança que uma action de cliente acabou de fazer
 * localmente — chamada depois do `set()`, lendo o cliente já atualizado
 * direto da store. */
function pushCliente(clientId: string) {
  const client = useAppStore.getState().clients.find((c) => c.id === clientId);
  if (client) pushFinanceiro("clients", clientId, clientId, client);
}
import type {
  TeamMember,
  HistoricoAcaoUsuario,
  Lead,
  LeadStage,
  Client,
  ClientStatus,
  DadosCadastrais,
  Responsaveis,
  Socio,
  Contato,
  FinanceiroCliente,
  HistoricoFinanceiro,
  Task,
  Obligation,
  ProcessoSocietario,
  Certificado,
  CertificadoStatus,
  Documento,
  Pendencia,
  TipoDocumentoRecorrente,
  EnvioMensalDocumento,
  StatusEnvioMensal,
  Anotacao,
  TimelineEvent,
  AppNotification,
  OnboardingChecklistItem,
  ServicoExtra,
  Licenca,
  Indicacao,
  DepartamentoChave,
  EtapaProcesso,
  ChecklistEntry,
  ChecklistStatus,
  ServicoPortfolio,
  Recebimento,
  Parcelamento,
  EnvioParcelamento,
  StatusEnvioParcelamento,
  BoletoMensal,
  NotaFiscalMensal,
  FaturamentoMensal,
  RecebimentoParceiroMensal,
  DadosEscritorio,
  SistemaEscritorio,
  DespesaAvulsa,
  PagamentoSistemaMensal,
  ContratoAssinatura,
  Funcionario,
  FeriasRegistro,
  RescisaoChecklistItem,
} from "@/lib/types";
import { RESCISAO_CHECKLIST } from "@/lib/types";
import { periodoAtivo } from "@/lib/ferias";

interface AppState {
  team: TeamMember[];
  dadosEscritorio: DadosEscritorio;
  sistemasEscritorio: SistemaEscritorio[];
  metaMensalClientes: number;
  despesasAvulsas: DespesaAvulsa[];
  pagamentosSistemas: PagamentoSistemaMensal[];
  contratosAssinatura: ContratoAssinatura[];
  funcionarios: Funcionario[];
  leads: Lead[];
  clients: Client[];
  tasks: Task[];
  obligations: Obligation[];
  processosSocietarios: ProcessoSocietario[];
  certificados: Certificado[];
  documentos: Documento[];
  pendencias: Pendencia[];
  tiposDocumentoRecorrente: TipoDocumentoRecorrente[];
  enviosMensaisDocumento: EnvioMensalDocumento[];
  anotacoes: Anotacao[];
  timeline: TimelineEvent[];
  notifications: AppNotification[];
  servicosExtras: ServicoExtra[];
  licencas: Licenca[];
  indicacoes: Indicacao[];
  servicosPortfolio: ServicoPortfolio[];
  recebimentos: Recebimento[];
  parcelamentos: Parcelamento[];
  enviosParcelamento: EnvioParcelamento[];
  boletosMensais: BoletoMensal[];
  notasFiscaisMensais: NotaFiscalMensal[];
  faturamentoMensal: FaturamentoMensal[];
  recebimentosParceiro: RecebimentoParceiroMensal[];
  checklistContabil: ChecklistEntry[];
  checklistFiscal: ChecklistEntry[];
  checklistPessoal: ChecklistEntry[];
  checklistMei: ChecklistEntry[];
  /** Matriz de permissões por colaborador, chave `${memberId}-${modulo}-${acao}`
   * (mesmo formato usado na tela de Equipe). Ausência de chave = liberado. */
  permissoes: Record<string, boolean>;

  updatePermissoes: (patch: Record<string, boolean>) => void;
  /** team/permissoes agora vêm do Supabase (Etapa 1 da migração) — essas
   * duas actions são usadas só pra aplicar o que chegou de lá na store
   * local, nunca chamadas direto pela UI. */
  setTeamFromSupabase: (team: TeamMember[]) => void;
  setPermissoesFromSupabase: (permissoes: Record<string, boolean>) => void;
  updateDadosEscritorio: (patch: Partial<DadosEscritorio>) => void;
  addSistemaEscritorio: (sistema: SistemaEscritorio) => void;
  updateSistemaEscritorio: (id: string, patch: Partial<SistemaEscritorio>) => void;
  deleteSistemaEscritorio: (id: string) => void;
  updateMetaMensalClientes: (valor: number) => void;
  addDespesaAvulsa: (despesa: DespesaAvulsa) => void;
  updateDespesaAvulsa: (id: string, patch: Partial<DespesaAvulsa>) => void;
  deleteDespesaAvulsa: (id: string) => void;
  updatePagamentoSistema: (sistemaId: string, competencia: string, patch: Partial<PagamentoSistemaMensal>) => void;
  addContratoAssinatura: (contrato: ContratoAssinatura) => void;
  updateContratoAssinatura: (id: string, patch: Partial<ContratoAssinatura>) => void;
  deleteContratoAssinatura: (id: string) => void;
  addFuncionario: (funcionario: Funcionario) => void;
  updateFuncionario: (id: string, patch: Partial<Funcionario>) => void;
  deleteFuncionario: (id: string) => void;
  confirmarPeriodoFerias: (funcionarioId: string) => void;
  updateDecimo13: (funcionarioId: string, ano: string, patch: Partial<{ primeiraParcelaPaga: boolean; segundaParcelaPaga: boolean }>) => void;
  iniciarRescisao: (funcionarioId: string, dataDesligamento: string, motivo?: string) => void;
  toggleRescisaoItem: (funcionarioId: string, itemId: string) => void;
  moveLead: (leadId: string, stage: LeadStage, autor: string) => void;
  addLead: (lead: Lead) => void;
  updateLead: (leadId: string, patch: Partial<Lead>) => void;
  deleteLead: (leadId: string) => void;
  updateTask: (taskId: string, patch: Partial<Task>) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  addObligation: (obligation: Obligation) => void;
  updateObligation: (obligationId: string, patch: Partial<Obligation>) => void;
  deleteObligation: (obligationId: string) => void;
  toggleOnboardingItem: (clientId: string, itemId: string) => void;
  addAnotacao: (nota: Anotacao) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  updateClientStatus: (clientId: string, status: ClientStatus) => void;
  updateClientTags: (clientId: string, tags: string[]) => void;
  updateTeamMemberClientes: (memberId: string, clientIds: string[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (memberId: string, patch: Partial<TeamMember>) => void;
  deleteTeamMember: (memberId: string) => void;
  updateClientDados: (clientId: string, patch: Partial<DadosCadastrais>) => void;
  updateClientResponsaveis: (clientId: string, patch: Partial<Responsaveis>) => void;
  addSocio: (clientId: string, socio: Socio) => void;
  updateSocio: (clientId: string, socioId: string, patch: Partial<Socio>) => void;
  deleteSocio: (clientId: string, socioId: string) => void;
  addContato: (clientId: string, contato: Contato) => void;
  updateContato: (clientId: string, contatoId: string, patch: Partial<Contato>) => void;
  deleteContato: (clientId: string, contatoId: string) => void;
  updateFinanceiroCliente: (clientId: string, patch: Partial<FinanceiroCliente>) => void;
  addHistoricoCliente: (clientId: string, entry: HistoricoFinanceiro) => void;
  updateHistoricoCliente: (clientId: string, entryId: string, patch: Partial<HistoricoFinanceiro>) => void;
  deleteHistoricoCliente: (clientId: string, entryId: string) => void;
  addDocumento: (doc: Documento) => void;
  deleteDocumento: (id: string) => void;
  // Só pra aplicar localmente o que veio do Supabase — nunca chamada direto pela UI.
  setDocumentosFromSupabase: (documentos: Documento[]) => void;
  addPendencia: (pendencia: Pendencia) => void;
  updatePendencia: (id: string, patch: Partial<Pendencia>) => void;
  deletePendencia: (id: string) => void;
  setPendenciasFromSupabase: (pendencias: Pendencia[]) => void;
  addTipoDocumentoRecorrente: (tipo: TipoDocumentoRecorrente) => void;
  updateTipoDocumentoRecorrente: (id: string, patch: Partial<TipoDocumentoRecorrente>) => void;
  deleteTipoDocumentoRecorrente: (id: string) => void;
  setTiposDocumentoRecorrenteFromSupabase: (tipos: TipoDocumentoRecorrente[]) => void;
  setEnvioMensal: (clienteId: string, tipoId: string, competencia: string, status: StatusEnvioMensal, documentoId?: string) => void;
  setEnviosMensaisDocumentoFromSupabase: (envios: EnvioMensalDocumento[]) => void;
  addProcessoSocietario: (processo: ProcessoSocietario) => void;
  updateProcessoSocietario: (id: string, patch: Partial<ProcessoSocietario>) => void;
  deleteProcessoSocietario: (id: string) => void;
  addEtapaProcesso: (processoId: string, etapa: EtapaProcesso) => void;
  setEtapaStatus: (processoId: string, etapaId: string, status: ChecklistStatus) => void;
  deleteEtapaProcesso: (processoId: string, etapaId: string) => void;
  addCertificado: (certificado: Certificado) => void;
  updateCertificado: (id: string, patch: Partial<Certificado>) => void;
  addRecebimento: (entry: Recebimento) => void;
  updateRecebimento: (id: string, patch: Partial<Recebimento>) => void;
  deleteRecebimento: (id: string) => void;
  addParcelamento: (parcelamento: Parcelamento) => void;
  updateParcelamento: (id: string, patch: Partial<Parcelamento>) => void;
  deleteParcelamento: (id: string) => void;
  setEnvioParcelamento: (parcelamentoId: string, competencia: string, status: StatusEnvioParcelamento) => void;
  updateBoleto: (
    clienteId: string,
    competencia: string,
    patch: Partial<Pick<BoletoMensal, "status" | "valor" | "vencimento" | "removido" | "recebido" | "dataRecebimento" | "valorRecebido" | "banco">>
  ) => void;
  updateNotaFiscal: (clienteId: string, competencia: string, patch: Partial<Pick<NotaFiscalMensal, "status" | "valor" | "numeroNota" | "removido">>) => void;
  updateFaturamentoMensal: (
    clienteId: string,
    competencia: string,
    patch: Partial<Pick<FaturamentoMensal, "faturamento" | "imposto" | "observacao" | "pgdasUrl">>
  ) => void;
  deleteFaturamentoMensal: (clienteId: string, competencia: string) => void;
  updateRecebimentoParceiro: (
    clienteId: string,
    competencia: string,
    patch: Partial<Pick<RecebimentoParceiroMensal, "status" | "valor" | "dataPagamento" | "removido" | "banco" | "tipoPessoa">>
  ) => void;
  updateNotaDepartamento: (clientId: string, depto: DepartamentoChave, nota: string) => void;
  // Etapa 3 da migração — Clientes e Financeiro vêm do Supabase agora
  // (tabela genérica `dados_financeiros`); essas setters só aplicam
  // localmente o que veio de lá, nunca chamadas direto pela UI.
  setClientsFromSupabase: (clients: Client[]) => void;
  setRecebimentosFromSupabase: (recebimentos: Recebimento[]) => void;
  setParcelamentosFromSupabase: (parcelamentos: Parcelamento[]) => void;
  setEnviosParcelamentoFromSupabase: (envios: EnvioParcelamento[]) => void;
  setBoletosMensaisFromSupabase: (boletos: BoletoMensal[]) => void;
  setNotasFiscaisMensaisFromSupabase: (notas: NotaFiscalMensal[]) => void;
  setFaturamentoMensalFromSupabase: (faturamentoMensal: FaturamentoMensal[]) => void;
  setRecebimentosParceiroFromSupabase: (recebimentos: RecebimentoParceiroMensal[]) => void;
  setDespesasAvulsasFromSupabase: (despesas: DespesaAvulsa[]) => void;
  setPagamentosSistemasFromSupabase: (pagamentos: PagamentoSistemaMensal[]) => void;
  // Etapa 4 da migração — todo o resto que ainda só vivia no navegador
  // (localStorage) agora também vem da mesma tabela genérica
  // `dados_financeiros`; essas setters só aplicam localmente o que veio
  // de lá, nunca chamadas direto pela UI.
  setLeadsFromSupabase: (leads: Lead[]) => void;
  setTasksFromSupabase: (tasks: Task[]) => void;
  setObligationsFromSupabase: (obligations: Obligation[]) => void;
  setProcessosSocietariosFromSupabase: (processos: ProcessoSocietario[]) => void;
  setCertificadosFromSupabase: (certificados: Certificado[]) => void;
  setAnotacoesFromSupabase: (anotacoes: Anotacao[]) => void;
  setTimelineFromSupabase: (timeline: TimelineEvent[]) => void;
  setServicosExtrasFromSupabase: (servicos: ServicoExtra[]) => void;
  setLicencasFromSupabase: (licencas: Licenca[]) => void;
  setIndicacoesFromSupabase: (indicacoes: Indicacao[]) => void;
  setServicosPortfolioFromSupabase: (servicos: ServicoPortfolio[]) => void;
  setChecklistContabilFromSupabase: (checklist: ChecklistEntry[]) => void;
  setChecklistFiscalFromSupabase: (checklist: ChecklistEntry[]) => void;
  setChecklistPessoalFromSupabase: (checklist: ChecklistEntry[]) => void;
  setChecklistMeiFromSupabase: (checklist: ChecklistEntry[]) => void;
  setSistemasEscritorioFromSupabase: (sistemas: SistemaEscritorio[]) => void;
  setDadosEscritorioFromSupabase: (dados: DadosEscritorio) => void;
  setMetaMensalClientesFromSupabase: (valor: number) => void;
  setContratosAssinaturaFromSupabase: (contratos: ContratoAssinatura[]) => void;
  setFuncionariosFromSupabase: (funcionarios: Funcionario[]) => void;
  /** Aplica quais alertas já foram lidos (o resto do conteúdo do alerta é
   * recalculado localmente a partir de licenças/certificados/clientes/
   * checklist fiscal, que já vêm do Supabase — só o "lida" precisa vir de
   * lá pra valer em qualquer aparelho). */
  applyNotificationsLidas: (idsLidos: string[]) => void;
  addLicenca: (licenca: Licenca) => void;
  updateLicenca: (id: string, patch: Partial<Licenca>) => void;
  deleteLicenca: (id: string) => void;
  addIndicacao: (indicacao: Indicacao) => void;
  updateIndicacao: (id: string, patch: Partial<Indicacao>) => void;
  deleteIndicacao: (id: string) => void;
  addServicoPortfolio: (servico: ServicoPortfolio) => void;
  updateServicoPortfolio: (id: string, patch: Partial<ServicoPortfolio>) => void;
  deleteServicoPortfolio: (id: string) => void;
  setChecklistContabil: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  setChecklistFiscal: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  setChecklistPessoal: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  setChecklistMei: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  resyncAlerts: () => void;
  resetData: () => void;
}

function syncAllAlerts(
  notifications: AppNotification[],
  licencas: Licenca[],
  certificados: Certificado[],
  clients: Client[],
  checklistFiscal: ChecklistEntry[],
  documentos: Documento[]
): AppNotification[] {
  return syncDocumentoAlerts(
    syncFiscalAlerts(
      syncCertificadoAlerts(syncLicencaAlerts(notifications, licencas, clients), certificados, clients),
      checklistFiscal,
      clients
    ),
    documentos,
    clients
  );
}

const initial = {
  team: TEAM,
  leads: LEADS,
  clients: CLIENTS,
  tasks: TASKS,
  obligations: OBLIGATIONS,
  processosSocietarios: PROCESSOS_SOCIETARIOS,
  certificados: CERTIFICADOS,
  documentos: DOCUMENTOS,
  pendencias: [] as Pendencia[],
  tiposDocumentoRecorrente: [] as TipoDocumentoRecorrente[],
  enviosMensaisDocumento: [] as EnvioMensalDocumento[],
  anotacoes: ANOTACOES,
  timeline: TIMELINE,
  notifications: syncAllAlerts(NOTIFICATIONS, LICENCAS, CERTIFICADOS, CLIENTS, [], DOCUMENTOS),
  servicosExtras: SERVICOS_EXTRAS,
  licencas: LICENCAS,
  indicacoes: INDICACOES,
  servicosPortfolio: SERVICOS_PORTFOLIO,
  recebimentos: [] as Recebimento[],
  parcelamentos: PARCELAMENTOS,
  enviosParcelamento: ENVIOS_PARCELAMENTO,
  boletosMensais: [] as BoletoMensal[],
  notasFiscaisMensais: [] as NotaFiscalMensal[],
  faturamentoMensal: [] as FaturamentoMensal[],
  recebimentosParceiro: [] as RecebimentoParceiroMensal[],
  checklistContabil: [],
  checklistFiscal: [],
  checklistPessoal: [],
  checklistMei: [],
  permissoes: {},
  dadosEscritorio: {
    razaoSocial: "Eleven Contabilidade & Consultoria",
    nomeFantasia: "Eleven",
    cnpj: "",
    email: "contato@somoselevencontabilidade.com",
    site: "",
    telefone: "",
    whatsapp: "",
    instagram: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    horarioAtendimento: "Segunda a sexta, 9h às 18h",
  },
  sistemasEscritorio: [],
  metaMensalClientes: 5,
  despesasAvulsas: [],
  pagamentosSistemas: [],
  contratosAssinatura: [],
  funcionarios: [],
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initial,

      moveLead: (leadId, stage, autor) => {
        set((s) => ({
          leads: s.leads.map((l) => {
            if (l.id !== leadId) return l;
            const historico = [
              ...l.historico,
              {
                id: `h-${Date.now()}`,
                data: new Date().toISOString().slice(0, 10),
                autor,
                descricao: `Movido de "${l.stage}" para "${stage}"`,
                deStage: l.stage,
                paraStage: stage,
              },
            ];
            return { ...l, stage, historico, dataUltimoContato: new Date().toISOString().slice(0, 10) };
          }),
        }));
        const lead = useAppStore.getState().leads.find((l) => l.id === leadId);
        if (lead) pushFinanceiro("leads", leadId, null, lead);
      },

      addLead: (lead) => {
        set((s) => ({ leads: [lead, ...s.leads] }));
        pushFinanceiro("leads", lead.id, null, lead);
      },
      updateLead: (leadId, patch) => {
        set((s) => ({ leads: s.leads.map((l) => (l.id === leadId ? { ...l, ...patch } : l)) }));
        const lead = useAppStore.getState().leads.find((l) => l.id === leadId);
        if (lead) pushFinanceiro("leads", leadId, null, lead);
      },
      deleteLead: (leadId) => {
        set((s) => ({ leads: s.leads.filter((l) => l.id !== leadId) }));
        deleteFinanceiro("leads", leadId);
      },

      updateTask: (taskId, patch) => {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }));
        const task = useAppStore.getState().tasks.find((t) => t.id === taskId);
        if (task) pushFinanceiro("tasks", taskId, task.clienteId ?? null, task);
      },

      addTask: (task) => {
        set((s) => ({ tasks: [task, ...s.tasks] }));
        pushFinanceiro("tasks", task.id, task.clienteId ?? null, task);
      },
      deleteTask: (taskId) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) }));
        deleteFinanceiro("tasks", taskId);
      },
      addObligation: (obligation) => {
        set((s) => ({ obligations: [obligation, ...s.obligations] }));
        pushFinanceiro("obligations", obligation.id, obligation.clienteId ?? null, obligation);
      },
      updateObligation: (obligationId, patch) => {
        set((s) => ({ obligations: s.obligations.map((o) => (o.id === obligationId ? { ...o, ...patch } : o)) }));
        const obligation = useAppStore.getState().obligations.find((o) => o.id === obligationId);
        if (obligation) pushFinanceiro("obligations", obligationId, obligation.clienteId ?? null, obligation);
      },
      deleteObligation: (obligationId) => {
        set((s) => ({ obligations: s.obligations.filter((o) => o.id !== obligationId) }));
        deleteFinanceiro("obligations", obligationId);
      },

      toggleOnboardingItem: (clientId, itemId) => {
        set((s) => ({
          clients: s.clients.map((c) => {
            if (c.id !== clientId) return c;
            const onboarding: OnboardingChecklistItem[] = c.onboarding.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    concluido: !item.concluido,
                    dataConclusao: !item.concluido ? new Date().toISOString().slice(0, 10) : undefined,
                  }
                : item
            );
            // Assim que o onboarding chega a 100%, o cliente passa sozinho para
            // Ativo — só quando ele ainda estava em Onboarding (não mexe em
            // status definidos manualmente, como Suspenso ou Encerrado).
            const completo = onboarding.length > 0 && onboarding.every((item) => item.concluido);
            const status = completo && c.status === "Onboarding" ? "Ativo" : c.status;
            return { ...c, onboarding, status };
          }),
        }));
        pushCliente(clientId);
      },

      addAnotacao: (nota) => {
        set((s) => ({ anotacoes: [nota, ...s.anotacoes] }));
        pushFinanceiro("anotacoes", nota.id, nota.clienteId, nota);
      },
      addTimelineEvent: (event) => {
        set((s) => ({ timeline: [event, ...s.timeline] }));
        pushFinanceiro("timeline", event.id, event.clienteId, event);
      },

      // Só o "lida" precisa ir pro banco — o resto do alerta é recalculado
      // localmente a partir de dados que já vêm do Supabase.
      markNotificationRead: (id) => {
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, lida: true } : n)) }));
        pushFinanceiro("notificacoesLidas", id, null, { id, lida: true });
      },
      markAllNotificationsRead: () => {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, lida: true })) }));
        for (const n of useAppStore.getState().notifications) {
          pushFinanceiro("notificacoesLidas", n.id, null, { id: n.id, lida: true });
        }
      },

      addClient: (client) => {
        set((s) => ({ clients: [client, ...s.clients] }));
        pushCliente(client.id);
        // Melhor esforço — cria de uma vez a pasta do cliente e as 6
        // subpastas por setor no Drive, mesmo sem Drive conectado o
        // cadastro do cliente não deve travar por isso.
        void fetch("/api/integracoes/google-drive/criar-pastas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clienteId: client.id, clienteNome: client.dados.nomeFantasia || client.dados.razaoSocial }),
        }).catch((err) => console.error("Erro ao criar pastas no Drive:", err));
      },
      deleteClient: (clientId) => {
        set((s) => ({
          clients: s.clients.filter((c) => c.id !== clientId),
          tasks: s.tasks.filter((t) => t.clienteId !== clientId),
          obligations: s.obligations.filter((o) => o.clienteId !== clientId),
          processosSocietarios: s.processosSocietarios.filter((p) => p.clienteId !== clientId),
          certificados: s.certificados.filter((c) => c.clienteId !== clientId),
          documentos: s.documentos.filter((d) => d.clienteId !== clientId),
          anotacoes: s.anotacoes.filter((a) => a.clienteId !== clientId),
          timeline: s.timeline.filter((t) => t.clienteId !== clientId),
          servicosExtras: s.servicosExtras.filter((se) => se.clienteId !== clientId),
          licencas: s.licencas.filter((l) => l.clienteId !== clientId),
          indicacoes: s.indicacoes.filter((i) => i.clienteId !== clientId),
          boletosMensais: s.boletosMensais.filter((b) => b.clienteId !== clientId),
          recebimentosParceiro: s.recebimentosParceiro.filter((r) => r.clienteId !== clientId),
          checklistContabil: s.checklistContabil.filter((e) => e.clienteId !== clientId),
          checklistFiscal: s.checklistFiscal.filter((e) => e.clienteId !== clientId),
          checklistPessoal: s.checklistPessoal.filter((e) => e.clienteId !== clientId),
          checklistMei: s.checklistMei.filter((e) => e.clienteId !== clientId),
        }));
        deleteFinanceiroPorCliente(clientId);
      },
      updateClientStatus: (clientId, status) => {
        set((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, status } : c)) }));
        pushCliente(clientId);
      },
      updateClientTags: (clientId, tags) => {
        set((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, tags } : c)) }));
        pushCliente(clientId);
      },
      updateTeamMemberClientes: (memberId, clientIds) => {
        set((s) => ({
          team: s.team.map((m) =>
            m.id === memberId
              ? { ...m, clientesVinculados: clientIds, historico: [...(m.historico ?? []), novaHistoricoEntry(s.team, "Empresas vinculadas atualizadas")] }
              : m
          ),
        }));
        void createClient()
          .from("profiles")
          .update({ clientes_vinculados: clientIds })
          .eq("id", memberId)
          .then(({ error }) => error && console.error("Erro ao salvar empresas vinculadas:", error.message));
      },
      // Só otimista — a criação de verdade (usuário de login + linha em
      // profiles) acontece via /api/colaboradores/criar (precisa da secret
      // key, roda no servidor). Essa action só reflete na tela na hora,
      // enquanto o Realtime não confirma o insert vindo do banco.
      addTeamMember: (member) =>
        set((s) => ({
          team: [...s.team, { ...member, historico: [novaHistoricoEntry(s.team, "Cadastro criado")] }],
        })),
      updateTeamMember: (memberId, patch) => {
        set((s) => ({
          team: s.team.map((m) =>
            m.id === memberId
              ? { ...m, ...patch, historico: [...(m.historico ?? []), novaHistoricoEntry(s.team, "Dados atualizados")] }
              : m
          ),
        }));
        const dbPatch: Record<string, unknown> = {};
        if (patch.nome !== undefined) dbPatch.nome = patch.nome;
        if (patch.email !== undefined) dbPatch.email = patch.email;
        if (patch.celular !== undefined) dbPatch.celular = patch.celular;
        if (patch.perfil !== undefined) dbPatch.perfil = patch.perfil;
        if (patch.departamentos !== undefined) dbPatch.departamentos = patch.departamentos;
        if (patch.avatarColor !== undefined) dbPatch.avatar_color = patch.avatarColor;
        if (patch.ativo !== undefined) dbPatch.ativo = patch.ativo;
        if (patch.clientesVinculados !== undefined) dbPatch.clientes_vinculados = patch.clientesVinculados;
        if (Object.keys(dbPatch).length > 0) {
          void createClient()
            .from("profiles")
            .update(dbPatch)
            .eq("id", memberId)
            .then(({ error }) => error && console.error("Erro ao salvar colaborador:", error.message));
        }
      },
      // Exclui o usuário de login de verdade — precisa da secret key, então
      // só o backend consegue (rota /api/colaboradores/excluir). Aqui só
      // tira da tela na hora; a rota já cuida de apagar em profiles também
      // (cascade), e o Realtime confirma.
      deleteTeamMember: (memberId) => {
        set((s) => ({ team: s.team.filter((m) => m.id !== memberId) }));
        void fetch("/api/colaboradores/excluir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: memberId }),
        }).catch((err) => console.error("Erro ao excluir colaborador:", err));
      },
      updatePermissoes: (patch) => {
        set((s) => ({ permissoes: { ...s.permissoes, ...patch } }));
        const rows = Object.entries(patch)
          .map(([key, allowed]) => {
            const parsed = parsePermissaoKey(key);
            return parsed ? { member_id: parsed.memberId, modulo: parsed.modulo, acao: parsed.acao, allowed } : null;
          })
          .filter((r): r is { member_id: string; modulo: string; acao: string; allowed: boolean } => r !== null);
        if (rows.length > 0) {
          void createClient()
            .from("permissions")
            .upsert(rows, { onConflict: "member_id,modulo,acao" })
            .then(({ error }) => error && console.error("Erro ao salvar permissões:", error.message));
        }
      },
      setTeamFromSupabase: (team) => set({ team }),
      setPermissoesFromSupabase: (permissoes) => set({ permissoes }),
      updateDadosEscritorio: (patch) => {
        set((s) => ({ dadosEscritorio: { ...s.dadosEscritorio, ...patch } }));
        pushFinanceiro("dadosEscritorio", "default", null, useAppStore.getState().dadosEscritorio);
      },
      addSistemaEscritorio: (sistema) => {
        set((s) => ({ sistemasEscritorio: [...s.sistemasEscritorio, sistema] }));
        pushFinanceiro("sistemasEscritorio", sistema.id, null, sistema);
      },
      updateSistemaEscritorio: (id, patch) => {
        set((s) => ({ sistemasEscritorio: s.sistemasEscritorio.map((sis) => (sis.id === id ? { ...sis, ...patch } : sis)) }));
        const sistema = useAppStore.getState().sistemasEscritorio.find((sis) => sis.id === id);
        if (sistema) pushFinanceiro("sistemasEscritorio", id, null, sistema);
      },
      deleteSistemaEscritorio: (id) => {
        set((s) => ({ sistemasEscritorio: s.sistemasEscritorio.filter((sis) => sis.id !== id) }));
        deleteFinanceiro("sistemasEscritorio", id);
      },
      updateMetaMensalClientes: (valor) => {
        set({ metaMensalClientes: valor });
        pushFinanceiro("metaMensalClientes", "default", null, { valor });
      },
      addDespesaAvulsa: (despesa) => {
        set((s) => ({ despesasAvulsas: [...s.despesasAvulsas, despesa] }));
        pushFinanceiro("despesasAvulsas", despesa.id, null, despesa);
      },
      updateDespesaAvulsa: (id, patch) => {
        set((s) => ({ despesasAvulsas: s.despesasAvulsas.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
        const item = useAppStore.getState().despesasAvulsas.find((d) => d.id === id);
        if (item) pushFinanceiro("despesasAvulsas", id, null, item);
      },
      deleteDespesaAvulsa: (id) => {
        set((s) => ({ despesasAvulsas: s.despesasAvulsas.filter((d) => d.id !== id) }));
        deleteFinanceiro("despesasAvulsas", id);
      },
      updatePagamentoSistema: (sistemaId, competencia, patch) => {
        const id = `pagsis-${sistemaId}-${competencia}`;
        set((s) => {
          const existente = s.pagamentosSistemas.find((p) => p.id === id);
          if (existente) {
            return { pagamentosSistemas: s.pagamentosSistemas.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
          }
          return {
            pagamentosSistemas: [...s.pagamentosSistemas, { id, sistemaId, competencia, status: "Em aberto", ...patch }],
          };
        });
        const item = useAppStore.getState().pagamentosSistemas.find((p) => p.id === id);
        if (item) pushFinanceiro("pagamentosSistemas", id, null, item);
      },
      addContratoAssinatura: (contrato) => {
        set((s) => ({ contratosAssinatura: [...s.contratosAssinatura, contrato] }));
        pushFinanceiro("contratosAssinatura", contrato.id, contrato.clienteId, contrato);
      },
      updateContratoAssinatura: (id, patch) => {
        set((s) => ({
          contratosAssinatura: s.contratosAssinatura.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
        const contrato = useAppStore.getState().contratosAssinatura.find((c) => c.id === id);
        if (contrato) pushFinanceiro("contratosAssinatura", id, contrato.clienteId, contrato);
      },
      deleteContratoAssinatura: (id) => {
        set((s) => ({ contratosAssinatura: s.contratosAssinatura.filter((c) => c.id !== id) }));
        deleteFinanceiro("contratosAssinatura", id);
      },
      addFuncionario: (funcionario) => {
        set((s) => ({ funcionarios: [...s.funcionarios, funcionario] }));
        pushFinanceiro("funcionarios", funcionario.id, funcionario.clienteId, funcionario);
      },
      updateFuncionario: (id, patch) => {
        set((s) => ({ funcionarios: s.funcionarios.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
        const funcionario = useAppStore.getState().funcionarios.find((f) => f.id === id);
        if (funcionario) pushFinanceiro("funcionarios", id, funcionario.clienteId, funcionario);
      },
      deleteFuncionario: (id) => {
        set((s) => ({ funcionarios: s.funcionarios.filter((f) => f.id !== id) }));
        deleteFinanceiro("funcionarios", id);
      },
      confirmarPeriodoFerias: (funcionarioId) => {
        set((s) => ({
          funcionarios: s.funcionarios.map((f) => {
            if (f.id !== funcionarioId || !f.feriasProgramadasInicio || !f.feriasProgramadasFim) return f;
            const { indice, periodoInicio, periodoFim } = periodoAtivo(f);
            const registro: FeriasRegistro = {
              indice,
              periodoInicio,
              periodoFim,
              feriasInicio: f.feriasProgramadasInicio,
              feriasFim: f.feriasProgramadasFim,
            };
            return {
              ...f,
              historicoFerias: [...f.historicoFerias, registro],
              feriasProgramadasInicio: undefined,
              feriasProgramadasFim: undefined,
            };
          }),
        }));
        const funcionario = useAppStore.getState().funcionarios.find((f) => f.id === funcionarioId);
        if (funcionario) pushFinanceiro("funcionarios", funcionarioId, funcionario.clienteId, funcionario);
      },
      updateDecimo13: (funcionarioId, ano, patch) => {
        set((s) => ({
          funcionarios: s.funcionarios.map((f) => {
            if (f.id !== funcionarioId) return f;
            const existente = f.decimosTerceiros.find((d) => d.ano === ano);
            const decimosTerceiros = existente
              ? f.decimosTerceiros.map((d) => (d.ano === ano ? { ...d, ...patch } : d))
              : [...f.decimosTerceiros, { ano, primeiraParcelaPaga: false, segundaParcelaPaga: false, ...patch }];
            return { ...f, decimosTerceiros };
          }),
        }));
        const funcionario = useAppStore.getState().funcionarios.find((f) => f.id === funcionarioId);
        if (funcionario) pushFinanceiro("funcionarios", funcionarioId, funcionario.clienteId, funcionario);
      },
      iniciarRescisao: (funcionarioId, dataDesligamento, motivo) => {
        set((s) => ({
          funcionarios: s.funcionarios.map((f) =>
            f.id === funcionarioId
              ? {
                  ...f,
                  ativo: false,
                  rescisao: {
                    dataDesligamento,
                    motivo,
                    checklist: RESCISAO_CHECKLIST.map((label, i) => ({ id: `resc-${funcionarioId}-${i}`, label, concluido: false })),
                  },
                }
              : f
          ),
        }));
        const funcionario = useAppStore.getState().funcionarios.find((f) => f.id === funcionarioId);
        if (funcionario) pushFinanceiro("funcionarios", funcionarioId, funcionario.clienteId, funcionario);
      },
      toggleRescisaoItem: (funcionarioId, itemId) => {
        set((s) => ({
          funcionarios: s.funcionarios.map((f) => {
            if (f.id !== funcionarioId || !f.rescisao) return f;
            const checklist = f.rescisao.checklist.map((item: RescisaoChecklistItem) =>
              item.id === itemId ? { ...item, concluido: !item.concluido } : item
            );
            return { ...f, rescisao: { ...f.rescisao, checklist } };
          }),
        }));
        const funcionario = useAppStore.getState().funcionarios.find((f) => f.id === funcionarioId);
        if (funcionario) pushFinanceiro("funcionarios", funcionarioId, funcionario.clienteId, funcionario);
      },
      updateClientDados: (clientId, patch) => {
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, dados: { ...c.dados, ...patch } } : c)),
        }));
        pushCliente(clientId);
      },
      updateClientResponsaveis: (clientId, patch) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, responsaveis: { ...c.responsaveis, ...patch } } : c
          ),
        }));
        pushCliente(clientId);
      },

      addSocio: (clientId, socio) => {
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, socios: [socio, ...c.socios] } : c)),
        }));
        pushCliente(clientId);
      },
      updateSocio: (clientId, socioId, patch) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, socios: c.socios.map((so) => (so.id === socioId ? { ...so, ...patch } : so)) }
              : c
          ),
        }));
        pushCliente(clientId);
      },
      deleteSocio: (clientId, socioId) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, socios: c.socios.filter((so) => so.id !== socioId) } : c
          ),
        }));
        pushCliente(clientId);
      },

      addContato: (clientId, contato) => {
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, contatos: [contato, ...c.contatos] } : c)),
        }));
        pushCliente(clientId);
      },
      updateContato: (clientId, contatoId, patch) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, contatos: c.contatos.map((co) => (co.id === contatoId ? { ...co, ...patch } : co)) }
              : c
          ),
        }));
        pushCliente(clientId);
      },
      deleteContato: (clientId, contatoId) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, contatos: c.contatos.filter((co) => co.id !== contatoId) } : c
          ),
        }));
        pushCliente(clientId);
      },

      updateFinanceiroCliente: (clientId, patch) => {
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, financeiro: { ...c.financeiro, ...patch } } : c)),
        }));
        pushCliente(clientId);
      },

      addHistoricoCliente: (clientId, entry) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, historicoFinanceiro: [entry, ...c.historicoFinanceiro] } : c
          ),
        }));
        pushCliente(clientId);
      },
      updateHistoricoCliente: (clientId, entryId, patch) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  historicoFinanceiro: c.historicoFinanceiro.map((h) => (h.id === entryId ? { ...h, ...patch } : h)),
                }
              : c
          ),
        }));
        pushCliente(clientId);
      },
      deleteHistoricoCliente: (clientId, entryId) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, historicoFinanceiro: c.historicoFinanceiro.filter((h) => h.id !== entryId) }
              : c
          ),
        }));
        pushCliente(clientId);
      },

      // Otimista — o registro de verdade em `documents` já foi feito por
      // /api/documentos/upload (que também cuida do envio pro Drive); aqui
      // só reflete na tela na hora, enquanto o Realtime não confirma.
      addDocumento: (doc) => set((s) => ({ documentos: [doc, ...s.documentos] })),
      // Some da tela na hora; a exclusão de verdade (linha em `documents` +
      // arquivo no Drive) acontece em /api/documentos/excluir.
      deleteDocumento: (id) => {
        set((s) => ({ documentos: s.documentos.filter((d) => d.id !== id) }));
        void fetch("/api/documentos/excluir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }).catch((err) => console.error("Erro ao excluir documento:", err));
      },
      setDocumentosFromSupabase: (documentos) =>
        set((s) => ({ documentos, notifications: syncDocumentoAlerts(s.notifications, documentos, s.clients) })),
      addPendencia: (pendencia) => {
        set((s) => ({ pendencias: [pendencia, ...s.pendencias] }));
        void createClient()
          .from("pendencias")
          .insert({
            id: pendencia.id,
            cliente_id: pendencia.clienteId,
            titulo: pendencia.titulo,
            tipo: pendencia.tipo,
            prazo: pendencia.prazo || null,
            status: pendencia.status,
            responsavel_id: pendencia.responsavelId || null,
          })
          .then(({ error }) => error && console.error("Erro ao salvar pendência:", error.message));
      },
      updatePendencia: (id, patch) => {
        set((s) => ({ pendencias: s.pendencias.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        const dbPatch: Record<string, unknown> = {};
        if (patch.titulo !== undefined) dbPatch.titulo = patch.titulo;
        if (patch.tipo !== undefined) dbPatch.tipo = patch.tipo;
        if (patch.prazo !== undefined) dbPatch.prazo = patch.prazo || null;
        if (patch.status !== undefined) dbPatch.status = patch.status;
        if (Object.keys(dbPatch).length > 0) {
          void createClient()
            .from("pendencias")
            .update(dbPatch)
            .eq("id", id)
            .then(({ error }) => error && console.error("Erro ao atualizar pendência:", error.message));
        }
      },
      deletePendencia: (id) => {
        set((s) => ({ pendencias: s.pendencias.filter((p) => p.id !== id) }));
        void createClient()
          .from("pendencias")
          .delete()
          .eq("id", id)
          .then(({ error }) => error && console.error("Erro ao excluir pendência:", error.message));
      },
      setPendenciasFromSupabase: (pendencias) => set({ pendencias }),
      addTipoDocumentoRecorrente: (tipo) => {
        set((s) => ({ tiposDocumentoRecorrente: [...s.tiposDocumentoRecorrente, tipo] }));
        void createClient()
          .from("tipos_documento_recorrente")
          .insert({ id: tipo.id, cliente_id: tipo.clienteId, nome: tipo.nome, ativo: tipo.ativo })
          .then(({ error }) => error && console.error("Erro ao salvar tipo de documento recorrente:", error.message));
      },
      updateTipoDocumentoRecorrente: (id, patch) => {
        set((s) => ({
          tiposDocumentoRecorrente: s.tiposDocumentoRecorrente.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
        const dbPatch: Record<string, unknown> = {};
        if (patch.nome !== undefined) dbPatch.nome = patch.nome;
        if (patch.ativo !== undefined) dbPatch.ativo = patch.ativo;
        if (Object.keys(dbPatch).length > 0) {
          void createClient()
            .from("tipos_documento_recorrente")
            .update(dbPatch)
            .eq("id", id)
            .then(({ error }) => error && console.error("Erro ao atualizar tipo de documento recorrente:", error.message));
        }
      },
      deleteTipoDocumentoRecorrente: (id) => {
        set((s) => ({ tiposDocumentoRecorrente: s.tiposDocumentoRecorrente.filter((t) => t.id !== id) }));
        void createClient()
          .from("tipos_documento_recorrente")
          .delete()
          .eq("id", id)
          .then(({ error }) => error && console.error("Erro ao excluir tipo de documento recorrente:", error.message));
      },
      setTiposDocumentoRecorrenteFromSupabase: (tiposDocumentoRecorrente) => set({ tiposDocumentoRecorrente }),
      // Passa pelo backend (rota /api/documentos/envio-mensal) porque quem
      // chama isso é, em regra, o Portal do Cliente — sem sessão Supabase
      // Auth, então não passaria pela RLS de uma escrita direta daqui.
      setEnvioMensal: (clienteId, tipoId, competencia, status, documentoId) => {
        const id = `${tipoId}-${competencia}`;
        set((s) => {
          const existe = s.enviosMensaisDocumento.some((e) => e.id === id);
          const envio: EnvioMensalDocumento = { id, clienteId, tipoId, competencia, status, documentoId };
          return {
            enviosMensaisDocumento: existe
              ? s.enviosMensaisDocumento.map((e) => (e.id === id ? envio : e))
              : [...s.enviosMensaisDocumento, envio],
          };
        });
        void fetch("/api/documentos/envio-mensal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clienteId, tipoId, competencia, status, documentoId }),
        }).catch((err) => console.error("Erro ao salvar envio mensal:", err));
      },
      setEnviosMensaisDocumentoFromSupabase: (enviosMensaisDocumento) => set({ enviosMensaisDocumento }),
      setClientsFromSupabase: (clients) => set({ clients }),
      setRecebimentosFromSupabase: (recebimentos) => set({ recebimentos }),
      setParcelamentosFromSupabase: (parcelamentos) => set({ parcelamentos }),
      setEnviosParcelamentoFromSupabase: (enviosParcelamento) => set({ enviosParcelamento }),
      setBoletosMensaisFromSupabase: (boletosMensais) => set({ boletosMensais }),
      setNotasFiscaisMensaisFromSupabase: (notasFiscaisMensais) => set({ notasFiscaisMensais }),
      setFaturamentoMensalFromSupabase: (faturamentoMensal) => set({ faturamentoMensal }),
      setRecebimentosParceiroFromSupabase: (recebimentosParceiro) => set({ recebimentosParceiro }),
      setDespesasAvulsasFromSupabase: (despesasAvulsas) => set({ despesasAvulsas }),
      setPagamentosSistemasFromSupabase: (pagamentosSistemas) => set({ pagamentosSistemas }),
      setLeadsFromSupabase: (leads) => set({ leads }),
      setTasksFromSupabase: (tasks) => set({ tasks }),
      setObligationsFromSupabase: (obligations) => set({ obligations }),
      setProcessosSocietariosFromSupabase: (processosSocietarios) => set({ processosSocietarios }),
      setCertificadosFromSupabase: (certificados) =>
        set((s) => ({ certificados, notifications: syncCertificadoAlerts(s.notifications, certificados, s.clients) })),
      setAnotacoesFromSupabase: (anotacoes) => set({ anotacoes }),
      setTimelineFromSupabase: (timeline) => set({ timeline }),
      setServicosExtrasFromSupabase: (servicosExtras) => set({ servicosExtras }),
      setLicencasFromSupabase: (licencas) =>
        set((s) => ({ licencas, notifications: syncLicencaAlerts(s.notifications, licencas, s.clients) })),
      setIndicacoesFromSupabase: (indicacoes) => set({ indicacoes }),
      setServicosPortfolioFromSupabase: (servicosPortfolio) => set({ servicosPortfolio }),
      setChecklistContabilFromSupabase: (checklistContabil) => set({ checklistContabil }),
      setChecklistFiscalFromSupabase: (checklistFiscal) =>
        set((s) => ({ checklistFiscal, notifications: syncFiscalAlerts(s.notifications, checklistFiscal, s.clients) })),
      setChecklistPessoalFromSupabase: (checklistPessoal) => set({ checklistPessoal }),
      setChecklistMeiFromSupabase: (checklistMei) => set({ checklistMei }),
      setSistemasEscritorioFromSupabase: (sistemasEscritorio) => set({ sistemasEscritorio }),
      setDadosEscritorioFromSupabase: (dadosEscritorio) => set({ dadosEscritorio }),
      setMetaMensalClientesFromSupabase: (metaMensalClientes) => set({ metaMensalClientes }),
      setContratosAssinaturaFromSupabase: (contratosAssinatura) => set({ contratosAssinatura }),
      setFuncionariosFromSupabase: (funcionarios) => set({ funcionarios }),
      applyNotificationsLidas: (idsLidos) =>
        set((s) => {
          const lidos = new Set(idsLidos);
          return { notifications: s.notifications.map((n) => (lidos.has(n.id) ? { ...n, lida: true } : n)) };
        }),

      addProcessoSocietario: (processo) => {
        set((s) => ({ processosSocietarios: [processo, ...s.processosSocietarios] }));
        pushFinanceiro("processosSocietarios", processo.id, processo.clienteId, processo);
      },

      updateProcessoSocietario: (id, patch) => {
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
        const processo = useAppStore.getState().processosSocietarios.find((p) => p.id === id);
        if (processo) pushFinanceiro("processosSocietarios", id, processo.clienteId, processo);
      },

      deleteProcessoSocietario: (id) => {
        set((s) => ({ processosSocietarios: s.processosSocietarios.filter((p) => p.id !== id) }));
        deleteFinanceiro("processosSocietarios", id);
      },

      addEtapaProcesso: (processoId, etapa) => {
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) =>
            p.id === processoId ? { ...p, etapas: [...(p.etapas ?? []), etapa] } : p
          ),
        }));
        const processo = useAppStore.getState().processosSocietarios.find((p) => p.id === processoId);
        if (processo) pushFinanceiro("processosSocietarios", processoId, processo.clienteId, processo);
      },

      setEtapaStatus: (processoId, etapaId, status) => {
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) =>
            p.id === processoId
              ? { ...p, etapas: (p.etapas ?? []).map((e) => (e.id === etapaId ? { ...e, status } : e)) }
              : p
          ),
        }));
        const processo = useAppStore.getState().processosSocietarios.find((p) => p.id === processoId);
        if (processo) pushFinanceiro("processosSocietarios", processoId, processo.clienteId, processo);
      },

      deleteEtapaProcesso: (processoId, etapaId) => {
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) =>
            p.id === processoId ? { ...p, etapas: (p.etapas ?? []).filter((e) => e.id !== etapaId) } : p
          ),
        }));
        const processo = useAppStore.getState().processosSocietarios.find((p) => p.id === processoId);
        if (processo) pushFinanceiro("processosSocietarios", processoId, processo.clienteId, processo);
      },

      addCertificado: (certificado) => {
        set((s) => {
          const certificados = [certificado, ...s.certificados];
          return { certificados, notifications: syncCertificadoAlerts(s.notifications, certificados, s.clients) };
        });
        pushFinanceiro("certificados", certificado.id, certificado.clienteId, certificado);
      },

      updateCertificado: (id, patch) => {
        set((s) => {
          const certificados = s.certificados.map((c) => (c.id === id ? { ...c, ...patch } : c));
          return { certificados, notifications: syncCertificadoAlerts(s.notifications, certificados, s.clients) };
        });
        const certificado = useAppStore.getState().certificados.find((c) => c.id === id);
        if (certificado) pushFinanceiro("certificados", id, certificado.clienteId, certificado);
      },

      addRecebimento: (entry) => {
        set((s) => ({ recebimentos: [entry, ...s.recebimentos] }));
        pushFinanceiro("recebimentos", entry.id, null, entry);
      },
      updateRecebimento: (id, patch) => {
        set((s) => ({ recebimentos: s.recebimentos.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
        const item = useAppStore.getState().recebimentos.find((r) => r.id === id);
        if (item) pushFinanceiro("recebimentos", id, null, item);
      },
      deleteRecebimento: (id) => {
        set((s) => ({ recebimentos: s.recebimentos.filter((r) => r.id !== id) }));
        deleteFinanceiro("recebimentos", id);
      },

      addParcelamento: (parcelamento) => {
        set((s) => ({ parcelamentos: [parcelamento, ...s.parcelamentos] }));
        pushFinanceiro("parcelamentos", parcelamento.id, null, parcelamento);
      },
      updateParcelamento: (id, patch) => {
        set((s) => ({ parcelamentos: s.parcelamentos.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
        const item = useAppStore.getState().parcelamentos.find((p) => p.id === id);
        if (item) pushFinanceiro("parcelamentos", id, null, item);
      },
      deleteParcelamento: (id) => {
        set((s) => ({
          parcelamentos: s.parcelamentos.filter((p) => p.id !== id),
          enviosParcelamento: s.enviosParcelamento.filter((e) => e.parcelamentoId !== id),
        }));
        deleteFinanceiro("parcelamentos", id);
        // Os envios desse parcelamento já saíram da tela acima — isso só limpa as linhas correspondentes no banco.
        void createClient()
          .from("dados_financeiros")
          .delete()
          .eq("tipo", "enviosParcelamento")
          .like("id", `env-${id}-%`)
          .then(({ error }) => error && console.error("Erro ao excluir envios do parcelamento:", error.message));
      },
      setEnvioParcelamento: (parcelamentoId, competencia, status) => {
        const id = `env-${parcelamentoId}-${competencia}`;
        set((s) => {
          const exists = s.enviosParcelamento.some((e) => e.id === id);
          return {
            enviosParcelamento: exists
              ? s.enviosParcelamento.map((e) => (e.id === id ? { ...e, status } : e))
              : [...s.enviosParcelamento, { id, parcelamentoId, competencia, status }],
          };
        });
        const item = useAppStore.getState().enviosParcelamento.find((e) => e.id === id);
        if (item) pushFinanceiro("enviosParcelamento", id, null, item);
      },

      updateBoleto: (clienteId, competencia, patch) => {
        const id = `bol-${clienteId}-${competencia}`;
        set((s) => {
          const exists = s.boletosMensais.some((b) => b.id === id);
          return {
            boletosMensais: exists
              ? s.boletosMensais.map((b) => (b.id === id ? { ...b, ...patch } : b))
              : [...s.boletosMensais, { id, clienteId, competencia, status: "Não emitido", ...patch }],
          };
        });
        const item = useAppStore.getState().boletosMensais.find((b) => b.id === id);
        if (item) pushFinanceiro("boletosMensais", id, clienteId, item);
      },

      updateNotaFiscal: (clienteId, competencia, patch) => {
        const id = `nfse-${clienteId}-${competencia}`;
        set((s) => {
          const exists = s.notasFiscaisMensais.some((n) => n.id === id);
          return {
            notasFiscaisMensais: exists
              ? s.notasFiscaisMensais.map((n) => (n.id === id ? { ...n, ...patch } : n))
              : [...s.notasFiscaisMensais, { id, clienteId, competencia, status: "Não emitida", ...patch }],
          };
        });
        const item = useAppStore.getState().notasFiscaisMensais.find((n) => n.id === id);
        if (item) pushFinanceiro("notasFiscaisMensais", id, clienteId, item);
      },

      updateFaturamentoMensal: (clienteId, competencia, patch) => {
        const id = `fat-${clienteId}-${competencia}`;
        set((s) => {
          const exists = s.faturamentoMensal.some((f) => f.id === id);
          return {
            faturamentoMensal: exists
              ? s.faturamentoMensal.map((f) => (f.id === id ? { ...f, ...patch } : f))
              : [...s.faturamentoMensal, { id, clienteId, competencia, ...patch }],
          };
        });
        const item = useAppStore.getState().faturamentoMensal.find((f) => f.id === id);
        if (item) pushFinanceiro("faturamentoMensal", id, clienteId, item);
      },

      deleteFaturamentoMensal: (clienteId, competencia) => {
        const id = `fat-${clienteId}-${competencia}`;
        set((s) => ({ faturamentoMensal: s.faturamentoMensal.filter((f) => f.id !== id) }));
        deleteFinanceiro("faturamentoMensal", id);
      },

      updateRecebimentoParceiro: (clienteId, competencia, patch) => {
        const id = `parc-${clienteId}-${competencia}`;
        set((s) => {
          const exists = s.recebimentosParceiro.some((r) => r.id === id);
          return {
            recebimentosParceiro: exists
              ? s.recebimentosParceiro.map((r) => (r.id === id ? { ...r, ...patch } : r))
              : [...s.recebimentosParceiro, { id, clienteId, competencia, status: "Em aberto", ...patch }],
          };
        });
        const item = useAppStore.getState().recebimentosParceiro.find((r) => r.id === id);
        if (item) pushFinanceiro("recebimentosParceiro", id, clienteId, item);
      },

      updateNotaDepartamento: (clientId, depto, nota) => {
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  notasDepartamentos: {
                    ...c.notasDepartamentos,
                    [depto]: { nota, atualizadoEm: new Date().toISOString().slice(0, 10) },
                  },
                }
              : c
          ),
        }));
        pushCliente(clientId);
      },

      addLicenca: (licenca) => {
        set((s) => {
          const licencas = [licenca, ...s.licencas];
          return { licencas, notifications: syncLicencaAlerts(s.notifications, licencas, s.clients) };
        });
        pushFinanceiro("licencas", licenca.id, licenca.clienteId, licenca);
      },
      updateLicenca: (id, patch) => {
        set((s) => {
          const licencas = s.licencas.map((l) => (l.id === id ? { ...l, ...patch } : l));
          return { licencas, notifications: syncLicencaAlerts(s.notifications, licencas, s.clients) };
        });
        const licenca = useAppStore.getState().licencas.find((l) => l.id === id);
        if (licenca) pushFinanceiro("licencas", id, licenca.clienteId, licenca);
      },
      deleteLicenca: (id) => {
        set((s) => {
          const licencas = s.licencas.filter((l) => l.id !== id);
          return { licencas, notifications: syncLicencaAlerts(s.notifications, licencas, s.clients) };
        });
        deleteFinanceiro("licencas", id);
      },

      addIndicacao: (indicacao) => {
        set((s) => ({ indicacoes: [indicacao, ...s.indicacoes] }));
        pushFinanceiro("indicacoes", indicacao.id, indicacao.clienteId, indicacao);
      },
      updateIndicacao: (id, patch) => {
        set((s) => ({ indicacoes: s.indicacoes.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
        const indicacao = useAppStore.getState().indicacoes.find((i) => i.id === id);
        if (indicacao) pushFinanceiro("indicacoes", id, indicacao.clienteId, indicacao);
      },
      deleteIndicacao: (id) => {
        set((s) => ({ indicacoes: s.indicacoes.filter((i) => i.id !== id) }));
        deleteFinanceiro("indicacoes", id);
      },

      addServicoPortfolio: (servico) => {
        set((s) => ({ servicosPortfolio: [servico, ...s.servicosPortfolio] }));
        pushFinanceiro("servicosPortfolio", servico.id, null, servico);
      },
      updateServicoPortfolio: (id, patch) => {
        set((s) => ({
          servicosPortfolio: s.servicosPortfolio.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp)),
        }));
        const servico = useAppStore.getState().servicosPortfolio.find((sp) => sp.id === id);
        if (servico) pushFinanceiro("servicosPortfolio", id, null, servico);
      },
      deleteServicoPortfolio: (id) => {
        set((s) => ({ servicosPortfolio: s.servicosPortfolio.filter((sp) => sp.id !== id) }));
        deleteFinanceiro("servicosPortfolio", id);
      },

      setChecklistContabil: (clienteId, competencia, rotina, status) => {
        const id = `chk-${clienteId}-${competencia}-${rotina}`;
        set((s) => {
          const existing = s.checklistContabil.find(
            (e) => e.clienteId === clienteId && e.competencia === competencia && e.rotina === rotina
          );
          if (!status) {
            return { checklistContabil: s.checklistContabil.filter((e) => e !== existing) };
          }
          if (existing) {
            return {
              checklistContabil: s.checklistContabil.map((e) => (e === existing ? { ...e, status } : e)),
            };
          }
          return {
            checklistContabil: [...s.checklistContabil, { id, clienteId, competencia, rotina, status }],
          };
        });
        if (!status) deleteFinanceiro("checklistContabil", id);
        else pushFinanceiro("checklistContabil", id, clienteId, { id, clienteId, competencia, rotina, status });
      },

      setChecklistFiscal: (clienteId, competencia, rotina, status) => {
        const id = `chkf-${clienteId}-${competencia}-${rotina}`;
        set((s) => {
          const existing = s.checklistFiscal.find(
            (e) => e.clienteId === clienteId && e.competencia === competencia && e.rotina === rotina
          );
          const checklistFiscal = !status
            ? s.checklistFiscal.filter((e) => e !== existing)
            : existing
              ? s.checklistFiscal.map((e) => (e === existing ? { ...e, status } : e))
              : [...s.checklistFiscal, { id, clienteId, competencia, rotina, status }];
          return {
            checklistFiscal,
            notifications: syncFiscalAlerts(s.notifications, checklistFiscal, s.clients),
          };
        });
        if (!status) deleteFinanceiro("checklistFiscal", id);
        else pushFinanceiro("checklistFiscal", id, clienteId, { id, clienteId, competencia, rotina, status });
      },

      setChecklistPessoal: (clienteId, competencia, rotina, status) => {
        const id = `chkp-${clienteId}-${competencia}-${rotina}`;
        set((s) => {
          const existing = s.checklistPessoal.find(
            (e) => e.clienteId === clienteId && e.competencia === competencia && e.rotina === rotina
          );
          if (!status) {
            return { checklistPessoal: s.checklistPessoal.filter((e) => e !== existing) };
          }
          if (existing) {
            return {
              checklistPessoal: s.checklistPessoal.map((e) => (e === existing ? { ...e, status } : e)),
            };
          }
          return {
            checklistPessoal: [...s.checklistPessoal, { id, clienteId, competencia, rotina, status }],
          };
        });
        if (!status) deleteFinanceiro("checklistPessoal", id);
        else pushFinanceiro("checklistPessoal", id, clienteId, { id, clienteId, competencia, rotina, status });
      },

      setChecklistMei: (clienteId, competencia, rotina, status) => {
        const id = `chkm-${clienteId}-${competencia}-${rotina}`;
        set((s) => {
          const existing = s.checklistMei.find(
            (e) => e.clienteId === clienteId && e.competencia === competencia && e.rotina === rotina
          );
          if (!status) {
            return { checklistMei: s.checklistMei.filter((e) => e !== existing) };
          }
          if (existing) {
            return {
              checklistMei: s.checklistMei.map((e) => (e === existing ? { ...e, status } : e)),
            };
          }
          return {
            checklistMei: [...s.checklistMei, { id, clienteId, competencia, rotina, status }],
          };
        });
        if (!status) deleteFinanceiro("checklistMei", id);
        else pushFinanceiro("checklistMei", id, clienteId, { id, clienteId, competencia, rotina, status });
      },

      resyncAlerts: () =>
        set((s) => ({
          notifications: syncAllAlerts(s.notifications, s.licencas, s.certificados, s.clients, s.checklistFiscal, s.documentos),
        })),

      resetData: () => set(initial),
    }),
    {
      name: "eleven-hub-store",
      version: 16,
      // Praticamente nada é persistido aqui — tudo já foi migrado pro
      // Supabase (Etapas 1 a 4) e é recarregado a cada sessão + mantido em
      // sincronia por Realtime, então guardar no localStorage só arriscaria
      // mostrar dado desatualizado antes da store terminar de buscar do
      // banco. `notifications` continua local (é recalculado a partir do
      // resto, só o "lida" vem do banco via applyNotificationsLidas).
      partialize: (state) => {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const {
          team,
          permissoes,
          documentos,
          pendencias,
          tiposDocumentoRecorrente,
          enviosMensaisDocumento,
          clients,
          recebimentos,
          parcelamentos,
          enviosParcelamento,
          boletosMensais,
          notasFiscaisMensais,
          faturamentoMensal,
          recebimentosParceiro,
          despesasAvulsas,
          pagamentosSistemas,
          leads,
          tasks,
          obligations,
          processosSocietarios,
          certificados,
          anotacoes,
          timeline,
          servicosExtras,
          licencas,
          indicacoes,
          servicosPortfolio,
          checklistContabil,
          checklistFiscal,
          checklistPessoal,
          checklistMei,
          sistemasEscritorio,
          dadosEscritorio,
          metaMensalClientes,
          contratosAssinatura,
          funcionarios,
          ...rest
        } = state;
        /* eslint-enable @typescript-eslint/no-unused-vars */
        return rest;
      },
      // Fill in fields added to existing records after they were first persisted,
      // so browsers with older cached state don't crash on undefined arrays.
      migrate: (persistedState: unknown) => {
        const state = persistedState as (Partial<AppState> & Record<string, unknown>) | undefined;
        if (state?.processosSocietarios) {
          state.processosSocietarios = state.processosSocietarios.map((p) => {
            const migratedEtapas: EtapaProcesso[] = (p.etapas ?? []).map((e) => {
              const old = e as unknown as { feito?: boolean; status?: ChecklistStatus };
              return { ...e, status: old.status ?? (old.feito ? "OK" : "Pendente") };
            });
            // "Abertura de empresa" always ships the same 27-step checklist. Older
            // sessions may have it persisted under a previous wording/order of
            // ETAPAS_ABERTURA_EMPRESA, which broke the "Por etapa" view (every cell
            // showed "—" and nothing was clickable, since the lookup by `descricao`
            // text no longer matched anything). Rebuild it here so it always has
            // exactly one entry per current step, reusing the saved status/id by
            // matching on descrição first and falling back to position.
            if (p.tipoServico === "Abertura de empresa" && migratedEtapas.length > 0) {
              const byDescricao = new Map(migratedEtapas.map((e) => [e.descricao, e]));
              return {
                ...p,
                etapas: ETAPAS_ABERTURA_EMPRESA.map((descricao, i) => {
                  const match = byDescricao.get(descricao) ?? migratedEtapas[i];
                  return match
                    ? { ...match, descricao }
                    : {
                        id: `et${i}`,
                        descricao,
                        responsavelId: p.responsavelId,
                        inicio: p.dataAbertura,
                        prazo: p.prazo ?? p.dataAbertura,
                        status: "Pendente" as ChecklistStatus,
                      };
                }),
              };
            }
            return { ...p, etapas: migratedEtapas };
          });
        }
        // The certificado status list was collapsed from 8 granular steps down to
        // Válido/Aguardando Renovação/Vencido — remap anything saved under the old set.
        if (state?.certificados) {
          const legacyStatusMap: Record<string, string> = {
            "Agendamento solicitado": "Aguardando Renovação",
            "Agendamento realizado": "Aguardando Renovação",
            "Aguardando validação": "Aguardando Renovação",
            "Renovação próxima": "Aguardando Renovação",
            Validado: "Válido",
            "Certificado aprovado": "Válido",
            Entregue: "Válido",
          };
          state.certificados = state.certificados.map((c) => ({
            ...c,
            status: (legacyStatusMap[c.status] ?? c.status) as CertificadoStatus,
          }));
        }
        // Onboarding checklist was rewritten to match the real setup workflow
        // (Fortes, e-Social, Nibo, etc.) — rebuild every client's checklist from
        // the current template, keeping the saved status for any item whose
        // label still matches and starting new items as pendente. The id is
        // always regenerated from the item's current position: an earlier
        // version of this migration reused a matched item's old id (assigned
        // under a previous template's ordering) while giving unmatched items a
        // fresh id based on the *new* position — two different items could end
        // up sharing an id across repeated reorders, so checking one silently
        // checked both (toggleOnboardingItem updates every item whose id
        // matches). Ids generated purely from the current index can't collide.
        if (state?.clients) {
          state.clients = state.clients.map((c) => {
            const byLabel = new Map((c.onboarding ?? []).map((o) => [o.label, o]));
            return {
              ...c,
              onboarding: ONBOARDING_TEMPLATE.map((label, i) => {
                const match = byLabel.get(label);
                return {
                  id: `ob-${c.id}-${i}`,
                  label,
                  concluido: match?.concluido ?? false,
                  dataConclusao: match?.dataConclusao,
                };
              }),
            };
          });
        }
        // Parcelamentos originally launched with only a "competencia" (YYYY-MM)
        // field. It was replaced by a full "dataInicio" date (to match the
        // "data de início do processo" pattern used elsewhere) plus new
        // "nome"/"cnpj"/"quantidadeParcelas" fields — backfill old records so
        // they don't disappear from the year/month filters.
        if (state?.parcelamentos) {
          state.parcelamentos = state.parcelamentos.map((p) => {
            const old = p as unknown as { competencia?: string; nome?: string; dataInicio?: string; tipo: string; cnpj?: string; cnpjCpf?: string };
            return {
              ...p,
              nome: old.nome ?? old.tipo,
              dataInicio: old.dataInicio ?? (old.competencia ? `${old.competencia}-01` : new Date().toISOString().slice(0, 10)),
              // O campo "cnpj" foi renomeado para "cnpjCpf" para deixar claro que
              // também aceita CPF, usado para identificar o cliente do parcelamento.
              cnpjCpf: old.cnpjCpf ?? old.cnpj,
            };
          });
          // A parcelamento used to carry one send status for the whole plan. It now
          // repeats every month for "quantidadeParcelas" months, with a separate
          // Enviado/Não enviado status per competência (EnvioParcelamento) — split
          // any legacy per-plan status into an entry for its first competência.
          const legacyEnvios: EnvioParcelamento[] = [];
          for (const p of state.parcelamentos) {
            const old = p as unknown as { status?: StatusEnvioParcelamento; dataInicio: string };
            if (old.status) {
              const competencia = old.dataInicio.slice(0, 7);
              legacyEnvios.push({ id: `env-${p.id}-${competencia}`, parcelamentoId: p.id, competencia, status: old.status });
            }
          }
          const existingEnvioIds = new Set(((state.enviosParcelamento as EnvioParcelamento[]) ?? []).map((e) => e.id));
          state.enviosParcelamento = [
            ...((state.enviosParcelamento as EnvioParcelamento[]) ?? []),
            ...legacyEnvios.filter((e) => !existingEnvioIds.has(e.id)),
          ];
        }
        // A conta "u1" (Kauane Gomes) é a sócia/chefe e deve enxergar todos os
        // setores, com o e-mail real dela — não o de demonstração do seed.
        // Idempotente e auto-corretivo: roda em todo carregamento e também
        // tira esse e-mail de qualquer outro cadastro (ex: colaboradores de
        // teste criados sem querer com o mesmo e-mail), porque só pode
        // pertencer a uma pessoa e o login usa o e-mail pra identificar quem
        // é quem.
        if (state?.team) {
          const EMAIL_KAUANE = "kauanegomescontadora@gmail.com";
          state.team = state.team.map((m) => {
            if (m.id === "u1") {
              return {
                ...m,
                nome: "Kauane Gomes",
                email: EMAIL_KAUANE,
                departamentos: ["Comercial", "Relacionamento", "Fiscal", "Contábil", "Pessoal", "Societário", "Financeiro", "Atendimento"],
              };
            }
            if (m.email.toLowerCase() === EMAIL_KAUANE.toLowerCase()) {
              return { ...m, email: `${m.id}@teste.eleven.com.br` };
            }
            return m;
          });
        }
        // Uma versão anterior bloqueava automaticamente TODOS os módulos de
        // qualquer colaborador sem nenhuma permissão configurada — passou
        // da conta: quem cadastra um colaborador espera que ele comece com
        // acesso normal e só restrinja pontualmente o que não deve ver (ex:
        // Financeiro), não que perca acesso a tudo. Desfaz esse bloqueio em
        // massa (nenhuma permissão explícita ainda tinha sido configurada
        // de propósito por ninguém, então é seguro voltar pro padrão
        // "liberado" limpando tudo).
        if (state) state.permissoes = {};
        return state;
      },
      // Recompute "licença vencendo" alerts on every load so the day countdown
      // (e.g. "vencendo em N dias") stays accurate, not just when a licença is edited.
      onRehydrateStorage: () => (state) => {
        state?.resyncAlerts();
      },
    }
  )
);
