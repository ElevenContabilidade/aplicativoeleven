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
import type {
  TeamMember,
  Lead,
  LeadStage,
  Client,
  DadosCadastrais,
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
} from "@/lib/types";

interface AppState {
  team: TeamMember[];
  leads: Lead[];
  clients: Client[];
  tasks: Task[];
  obligations: Obligation[];
  processosSocietarios: ProcessoSocietario[];
  certificados: Certificado[];
  documentos: Documento[];
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
  checklistContabil: ChecklistEntry[];
  checklistFiscal: ChecklistEntry[];
  checklistPessoal: ChecklistEntry[];

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
  updateClientDados: (clientId: string, patch: Partial<DadosCadastrais>) => void;
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
  addProcessoSocietario: (processo: ProcessoSocietario) => void;
  updateProcessoSocietario: (id: string, patch: Partial<ProcessoSocietario>) => void;
  deleteProcessoSocietario: (id: string) => void;
  addEtapaProcesso: (processoId: string, etapa: EtapaProcesso) => void;
  setEtapaStatus: (processoId: string, etapaId: string, status: ChecklistStatus) => void;
  deleteEtapaProcesso: (processoId: string, etapaId: string) => void;
  addCertificado: (certificado: Certificado) => void;
  updateCertificado: (id: string, patch: Partial<Certificado>) => void;
  addRecebimento: (entry: Recebimento) => void;
  deleteRecebimento: (id: string) => void;
  addParcelamento: (parcelamento: Parcelamento) => void;
  updateParcelamento: (id: string, patch: Partial<Parcelamento>) => void;
  deleteParcelamento: (id: string) => void;
  setEnvioParcelamento: (parcelamentoId: string, competencia: string, status: StatusEnvioParcelamento) => void;
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
  checklistContabil: [],
  checklistFiscal: [],
  checklistPessoal: [],
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
            return { ...c, onboarding };
          }),
        })),

      addAnotacao: (nota) => set((s) => ({ anotacoes: [nota, ...s.anotacoes] })),
      addTimelineEvent: (event) => set((s) => ({ timeline: [event, ...s.timeline] })),

      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, lida: true } : n)) })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, lida: true })) })),

      addClient: (client) => set((s) => ({ clients: [client, ...s.clients] })),
      updateClientDados: (clientId, patch) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === clientId ? { ...c, dados: { ...c.dados, ...patch } } : c)),
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

      addDocumento: (doc) => set((s) => ({ documentos: [doc, ...s.documentos] })),
      deleteDocumento: (id) => set((s) => ({ documentos: s.documentos.filter((d) => d.id !== id) })),

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

      resyncAlerts: () =>
        set((s) => ({
          notifications: syncAllAlerts(s.notifications, s.licencas, s.certificados, s.clients, s.checklistFiscal),
        })),

      resetData: () => set(initial),
    }),
    {
      name: "eleven-hub-store",
      version: 10,
      // blob: object URLs only live for this browser session — never persist them.
      partialize: (state) => ({
        ...state,
        documentos: state.documentos.map((d) => {
          const { url, ...rest } = d;
          return url ? rest : d;
        }),
      }),
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
            const old = p as unknown as { competencia?: string; nome?: string; dataInicio?: string; tipo: string };
            return {
              ...p,
              nome: old.nome ?? old.tipo,
              dataInicio: old.dataInicio ?? (old.competencia ? `${old.competencia}-01` : new Date().toISOString().slice(0, 10)),
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
