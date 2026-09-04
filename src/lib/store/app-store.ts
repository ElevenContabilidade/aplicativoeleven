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
  updateRecebimentoParceiro: (
    clienteId: string,
    competencia: string,
    patch: Partial<Pick<RecebimentoParceiroMensal, "status" | "valor" | "dataPagamento" | "removido" | "banco" | "tipoPessoa">>
  ) => void;
  updateNotaDepartamento: (clientId: string, depto: DepartamentoChave, nota: string) => void;
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
  checklistFiscal: ChecklistEntry[]
): AppNotification[] {
  return syncFiscalAlerts(
    syncCertificadoAlerts(syncLicencaAlerts(notifications, licencas, clients), certificados, clients),
    checklistFiscal,
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
  notifications: syncAllAlerts(NOTIFICATIONS, LICENCAS, CERTIFICADOS, CLIENTS, []),
  servicosExtras: SERVICOS_EXTRAS,
  licencas: LICENCAS,
  indicacoes: INDICACOES,
  servicosPortfolio: SERVICOS_PORTFOLIO,
  recebimentos: [] as Recebimento[],
  parcelamentos: PARCELAMENTOS,
  enviosParcelamento: ENVIOS_PARCELAMENTO,
  boletosMensais: [] as BoletoMensal[],
  notasFiscaisMensais: [] as NotaFiscalMensal[],
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

      moveLead: (leadId, stage, autor) =>
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
        })),

      addLead: (lead) => set((s) => ({ leads: [lead, ...s.leads] })),
      updateLead: (leadId, patch) =>
        set((s) => ({ leads: s.leads.map((l) => (l.id === leadId ? { ...l, ...patch } : l)) })),
      deleteLead: (leadId) => set((s) => ({ leads: s.leads.filter((l) => l.id !== leadId) })),

      updateTask: (taskId, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) })),

      addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
      deleteTask: (taskId) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId) })),

      toggleOnboardingItem: (clientId, itemId) =>
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
        })),

      addAnotacao: (nota) => set((s) => ({ anotacoes: [nota, ...s.anotacoes] })),
      addTimelineEvent: (event) => set((s) => ({ timeline: [event, ...s.timeline] })),

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, lida: true } : n)) })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, lida: true })) })),

      addClient: (client) => set((s) => ({ clients: [client, ...s.clients] })),
      deleteClient: (clientId) =>
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
        })),
      updateClientStatus: (clientId, status) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, status } : c)) })),
      updateClientTags: (clientId, tags) =>
        set((s) => ({ clients: s.clients.map((c) => (c.id === clientId ? { ...c, tags } : c)) })),
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
      updateDadosEscritorio: (patch) => set((s) => ({ dadosEscritorio: { ...s.dadosEscritorio, ...patch } })),
      addSistemaEscritorio: (sistema) => set((s) => ({ sistemasEscritorio: [...s.sistemasEscritorio, sistema] })),
      updateSistemaEscritorio: (id, patch) =>
        set((s) => ({ sistemasEscritorio: s.sistemasEscritorio.map((sis) => (sis.id === id ? { ...sis, ...patch } : sis)) })),
      deleteSistemaEscritorio: (id) => set((s) => ({ sistemasEscritorio: s.sistemasEscritorio.filter((sis) => sis.id !== id) })),
      updateMetaMensalClientes: (valor) => set({ metaMensalClientes: valor }),
      addDespesaAvulsa: (despesa) => set((s) => ({ despesasAvulsas: [...s.despesasAvulsas, despesa] })),
      updateDespesaAvulsa: (id, patch) =>
        set((s) => ({ despesasAvulsas: s.despesasAvulsas.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
      deleteDespesaAvulsa: (id) => set((s) => ({ despesasAvulsas: s.despesasAvulsas.filter((d) => d.id !== id) })),
      updatePagamentoSistema: (sistemaId, competencia, patch) =>
        set((s) => {
          const id = `pagsis-${sistemaId}-${competencia}`;
          const existente = s.pagamentosSistemas.find((p) => p.id === id);
          if (existente) {
            return { pagamentosSistemas: s.pagamentosSistemas.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
          }
          return {
            pagamentosSistemas: [...s.pagamentosSistemas, { id, sistemaId, competencia, status: "Em aberto", ...patch }],
          };
        }),
      addContratoAssinatura: (contrato) => set((s) => ({ contratosAssinatura: [...s.contratosAssinatura, contrato] })),
      updateContratoAssinatura: (id, patch) =>
        set((s) => ({
          contratosAssinatura: s.contratosAssinatura.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteContratoAssinatura: (id) =>
        set((s) => ({ contratosAssinatura: s.contratosAssinatura.filter((c) => c.id !== id) })),
      addFuncionario: (funcionario) => set((s) => ({ funcionarios: [...s.funcionarios, funcionario] })),
      updateFuncionario: (id, patch) =>
        set((s) => ({ funcionarios: s.funcionarios.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      deleteFuncionario: (id) => set((s) => ({ funcionarios: s.funcionarios.filter((f) => f.id !== id) })),
      confirmarPeriodoFerias: (funcionarioId) =>
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
        })),
      updateDecimo13: (funcionarioId, ano, patch) =>
        set((s) => ({
          funcionarios: s.funcionarios.map((f) => {
            if (f.id !== funcionarioId) return f;
            const existente = f.decimosTerceiros.find((d) => d.ano === ano);
            const decimosTerceiros = existente
              ? f.decimosTerceiros.map((d) => (d.ano === ano ? { ...d, ...patch } : d))
              : [...f.decimosTerceiros, { ano, primeiraParcelaPaga: false, segundaParcelaPaga: false, ...patch }];
            return { ...f, decimosTerceiros };
          }),
        })),
      iniciarRescisao: (funcionarioId, dataDesligamento, motivo) =>
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
        })),
      toggleRescisaoItem: (funcionarioId, itemId) =>
        set((s) => ({
          funcionarios: s.funcionarios.map((f) => {
            if (f.id !== funcionarioId || !f.rescisao) return f;
            const checklist = f.rescisao.checklist.map((item: RescisaoChecklistItem) =>
              item.id === itemId ? { ...item, concluido: !item.concluido } : item
            );
            return { ...f, rescisao: { ...f.rescisao, checklist } };
          }),
        })),
      updateClientDados: (clientId, patch) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, dados: { ...c.dados, ...patch } } : c)),
        })),
      updateClientResponsaveis: (clientId, patch) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, responsaveis: { ...c.responsaveis, ...patch } } : c
          ),
        })),

      addSocio: (clientId, socio) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, socios: [socio, ...c.socios] } : c)),
        })),
      updateSocio: (clientId, socioId, patch) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, socios: c.socios.map((so) => (so.id === socioId ? { ...so, ...patch } : so)) }
              : c
          ),
        })),
      deleteSocio: (clientId, socioId) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, socios: c.socios.filter((so) => so.id !== socioId) } : c
          ),
        })),

      addContato: (clientId, contato) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, contatos: [contato, ...c.contatos] } : c)),
        })),
      updateContato: (clientId, contatoId, patch) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, contatos: c.contatos.map((co) => (co.id === contatoId ? { ...co, ...patch } : co)) }
              : c
          ),
        })),
      deleteContato: (clientId, contatoId) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, contatos: c.contatos.filter((co) => co.id !== contatoId) } : c
          ),
        })),

      updateFinanceiroCliente: (clientId, patch) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, financeiro: { ...c.financeiro, ...patch } } : c)),
        })),

      addHistoricoCliente: (clientId, entry) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, historicoFinanceiro: [entry, ...c.historicoFinanceiro] } : c
          ),
        })),
      updateHistoricoCliente: (clientId, entryId, patch) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  historicoFinanceiro: c.historicoFinanceiro.map((h) => (h.id === entryId ? { ...h, ...patch } : h)),
                }
              : c
          ),
        })),
      deleteHistoricoCliente: (clientId, entryId) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId
              ? { ...c, historicoFinanceiro: c.historicoFinanceiro.filter((h) => h.id !== entryId) }
              : c
          ),
        })),

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
      setDocumentosFromSupabase: (documentos) => set({ documentos }),
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

      addProcessoSocietario: (processo) =>
        set((s) => ({ processosSocietarios: [processo, ...s.processosSocietarios] })),

      updateProcessoSocietario: (id, patch) =>
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProcessoSocietario: (id) =>
        set((s) => ({ processosSocietarios: s.processosSocietarios.filter((p) => p.id !== id) })),

      addEtapaProcesso: (processoId, etapa) =>
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) =>
            p.id === processoId ? { ...p, etapas: [...(p.etapas ?? []), etapa] } : p
          ),
        })),

      setEtapaStatus: (processoId, etapaId, status) =>
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) =>
            p.id === processoId
              ? { ...p, etapas: (p.etapas ?? []).map((e) => (e.id === etapaId ? { ...e, status } : e)) }
              : p
          ),
        })),

      deleteEtapaProcesso: (processoId, etapaId) =>
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) =>
            p.id === processoId ? { ...p, etapas: (p.etapas ?? []).filter((e) => e.id !== etapaId) } : p
          ),
        })),

      addCertificado: (certificado) =>
        set((s) => {
          const certificados = [certificado, ...s.certificados];
          return { certificados, notifications: syncCertificadoAlerts(s.notifications, certificados, s.clients) };
        }),

      updateCertificado: (id, patch) =>
        set((s) => {
          const certificados = s.certificados.map((c) => (c.id === id ? { ...c, ...patch } : c));
          return { certificados, notifications: syncCertificadoAlerts(s.notifications, certificados, s.clients) };
        }),

      addRecebimento: (entry) => set((s) => ({ recebimentos: [entry, ...s.recebimentos] })),
      updateRecebimento: (id, patch) =>
        set((s) => ({ recebimentos: s.recebimentos.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRecebimento: (id) => set((s) => ({ recebimentos: s.recebimentos.filter((r) => r.id !== id) })),

      addParcelamento: (parcelamento) => set((s) => ({ parcelamentos: [parcelamento, ...s.parcelamentos] })),
      updateParcelamento: (id, patch) =>
        set((s) => ({ parcelamentos: s.parcelamentos.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteParcelamento: (id) =>
        set((s) => ({
          parcelamentos: s.parcelamentos.filter((p) => p.id !== id),
          enviosParcelamento: s.enviosParcelamento.filter((e) => e.parcelamentoId !== id),
        })),
      setEnvioParcelamento: (parcelamentoId, competencia, status) =>
        set((s) => {
          const id = `env-${parcelamentoId}-${competencia}`;
          const exists = s.enviosParcelamento.some((e) => e.id === id);
          return {
            enviosParcelamento: exists
              ? s.enviosParcelamento.map((e) => (e.id === id ? { ...e, status } : e))
              : [...s.enviosParcelamento, { id, parcelamentoId, competencia, status }],
          };
        }),

      updateBoleto: (clienteId, competencia, patch) =>
        set((s) => {
          const id = `bol-${clienteId}-${competencia}`;
          const exists = s.boletosMensais.some((b) => b.id === id);
          return {
            boletosMensais: exists
              ? s.boletosMensais.map((b) => (b.id === id ? { ...b, ...patch } : b))
              : [...s.boletosMensais, { id, clienteId, competencia, status: "Não emitido", ...patch }],
          };
        }),

      updateNotaFiscal: (clienteId, competencia, patch) =>
        set((s) => {
          const id = `nfse-${clienteId}-${competencia}`;
          const exists = s.notasFiscaisMensais.some((n) => n.id === id);
          return {
            notasFiscaisMensais: exists
              ? s.notasFiscaisMensais.map((n) => (n.id === id ? { ...n, ...patch } : n))
              : [...s.notasFiscaisMensais, { id, clienteId, competencia, status: "Não emitida", ...patch }],
          };
        }),

      updateRecebimentoParceiro: (clienteId, competencia, patch) =>
        set((s) => {
          const id = `parc-${clienteId}-${competencia}`;
          const exists = s.recebimentosParceiro.some((r) => r.id === id);
          return {
            recebimentosParceiro: exists
              ? s.recebimentosParceiro.map((r) => (r.id === id ? { ...r, ...patch } : r))
              : [...s.recebimentosParceiro, { id, clienteId, competencia, status: "Em aberto", ...patch }],
          };
        }),

      updateNotaDepartamento: (clientId, depto, nota) =>
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
        })),

      addLicenca: (licenca) =>
        set((s) => {
          const licencas = [licenca, ...s.licencas];
          return { licencas, notifications: syncLicencaAlerts(s.notifications, licencas, s.clients) };
        }),
      updateLicenca: (id, patch) =>
        set((s) => {
          const licencas = s.licencas.map((l) => (l.id === id ? { ...l, ...patch } : l));
          return { licencas, notifications: syncLicencaAlerts(s.notifications, licencas, s.clients) };
        }),
      deleteLicenca: (id) =>
        set((s) => {
          const licencas = s.licencas.filter((l) => l.id !== id);
          return { licencas, notifications: syncLicencaAlerts(s.notifications, licencas, s.clients) };
        }),

      addIndicacao: (indicacao) => set((s) => ({ indicacoes: [indicacao, ...s.indicacoes] })),
      updateIndicacao: (id, patch) =>
        set((s) => ({ indicacoes: s.indicacoes.map((i) => (i.id === id ? { ...i, ...patch } : i)) })),
      deleteIndicacao: (id) => set((s) => ({ indicacoes: s.indicacoes.filter((i) => i.id !== id) })),

      addServicoPortfolio: (servico) =>
        set((s) => ({ servicosPortfolio: [servico, ...s.servicosPortfolio] })),
      updateServicoPortfolio: (id, patch) =>
        set((s) => ({
          servicosPortfolio: s.servicosPortfolio.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp)),
        })),
      deleteServicoPortfolio: (id) =>
        set((s) => ({ servicosPortfolio: s.servicosPortfolio.filter((sp) => sp.id !== id) })),

      setChecklistContabil: (clienteId, competencia, rotina, status) =>
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
            checklistContabil: [
              ...s.checklistContabil,
              { id: `chk-${clienteId}-${competencia}-${rotina}`, clienteId, competencia, rotina, status },
            ],
          };
        }),

      setChecklistFiscal: (clienteId, competencia, rotina, status) =>
        set((s) => {
          const existing = s.checklistFiscal.find(
            (e) => e.clienteId === clienteId && e.competencia === competencia && e.rotina === rotina
          );
          const checklistFiscal = !status
            ? s.checklistFiscal.filter((e) => e !== existing)
            : existing
              ? s.checklistFiscal.map((e) => (e === existing ? { ...e, status } : e))
              : [
                  ...s.checklistFiscal,
                  { id: `chkf-${clienteId}-${competencia}-${rotina}`, clienteId, competencia, rotina, status },
                ];
          return {
            checklistFiscal,
            notifications: syncFiscalAlerts(s.notifications, checklistFiscal, s.clients),
          };
        }),

      setChecklistPessoal: (clienteId, competencia, rotina, status) =>
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
            checklistPessoal: [
              ...s.checklistPessoal,
              { id: `chkp-${clienteId}-${competencia}-${rotina}`, clienteId, competencia, rotina, status },
            ],
          };
        }),

      setChecklistMei: (clienteId, competencia, rotina, status) =>
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
            checklistMei: [
              ...s.checklistMei,
              { id: `chkm-${clienteId}-${competencia}-${rotina}`, clienteId, competencia, rotina, status },
            ],
          };
        }),

      resyncAlerts: () =>
        set((s) => ({
          notifications: syncAllAlerts(s.notifications, s.licencas, s.certificados, s.clients, s.checklistFiscal),
        })),

      resetData: () => set(initial),
    }),
    {
      name: "eleven-hub-store",
      version: 16,
      // team, permissoes, documentos, pendencias, tiposDocumentoRecorrente e
      // enviosMensaisDocumento não são mais persistidos aqui — vêm do
      // Supabase e são recarregados a cada sessão + mantidos em sincronia
      // por Realtime, então guardá-los no localStorage só arriscaria
      // mostrar dado desatualizado antes da store terminar de buscar do banco.
      partialize: (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { team, permissoes, documentos, pendencias, tiposDocumentoRecorrente, enviosMensaisDocumento, ...rest } = state;
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
