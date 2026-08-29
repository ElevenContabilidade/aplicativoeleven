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
} from "@/lib/data/seed";
import { syncLicencaAlerts } from "@/lib/licenca-alerts";
import type {
  TeamMember,
  Lead,
  LeadStage,
  Client,
  DadosCadastrais,
  HistoricoFinanceiro,
  Task,
  Obligation,
  ProcessoSocietario,
  Certificado,
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
  addDocumento: (doc: Documento) => void;
  deleteDocumento: (id: string) => void;
  addProcessoSocietario: (processo: ProcessoSocietario) => void;
  updateProcessoSocietario: (id: string, patch: Partial<ProcessoSocietario>) => void;
  addEtapaProcesso: (processoId: string, etapa: EtapaProcesso) => void;
  setEtapaStatus: (processoId: string, etapaId: string, status: ChecklistStatus) => void;
  deleteEtapaProcesso: (processoId: string, etapaId: string) => void;
  addCertificado: (certificado: Certificado) => void;
  addRecebimento: (clientId: string, entry: HistoricoFinanceiro) => void;
  updateNotaDepartamento: (clientId: string, depto: DepartamentoChave, nota: string) => void;
  addLicenca: (licenca: Licenca) => void;
  updateLicenca: (id: string, patch: Partial<Licenca>) => void;
  deleteLicenca: (id: string) => void;
  addIndicacao: (indicacao: Indicacao) => void;
  updateIndicacao: (id: string, patch: Partial<Indicacao>) => void;
  deleteIndicacao: (id: string) => void;
  setChecklistContabil: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  setChecklistFiscal: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  setChecklistPessoal: (clienteId: string, competencia: string, rotina: string, status: ChecklistStatus | null) => void;
  resyncLicencaAlerts: () => void;
  resetData: () => void;
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
  notifications: syncLicencaAlerts(NOTIFICATIONS, LICENCAS, CLIENTS),
  servicosExtras: SERVICOS_EXTRAS,
  licencas: LICENCAS,
  indicacoes: INDICACOES,
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

      addDocumento: (doc) => set((s) => ({ documentos: [doc, ...s.documentos] })),
      deleteDocumento: (id) => set((s) => ({ documentos: s.documentos.filter((d) => d.id !== id) })),

      addProcessoSocietario: (processo) =>
        set((s) => ({ processosSocietarios: [processo, ...s.processosSocietarios] })),

      updateProcessoSocietario: (id, patch) =>
        set((s) => ({
          processosSocietarios: s.processosSocietarios.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

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

      addCertificado: (certificado) => set((s) => ({ certificados: [certificado, ...s.certificados] })),

      addRecebimento: (clientId, entry) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === clientId ? { ...c, historicoFinanceiro: [entry, ...c.historicoFinanceiro] } : c
          ),
        })),

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
          if (!status) {
            return { checklistFiscal: s.checklistFiscal.filter((e) => e !== existing) };
          }
          if (existing) {
            return {
              checklistFiscal: s.checklistFiscal.map((e) => (e === existing ? { ...e, status } : e)),
            };
          }
          return {
            checklistFiscal: [
              ...s.checklistFiscal,
              { id: `chkf-${clienteId}-${competencia}-${rotina}`, clienteId, competencia, rotina, status },
            ],
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

      resyncLicencaAlerts: () =>
        set((s) => ({ notifications: syncLicencaAlerts(s.notifications, s.licencas, s.clients) })),

      resetData: () => set(initial),
    }),
    {
      name: "eleven-hub-store",
      version: 3,
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
          state.processosSocietarios = state.processosSocietarios.map((p) => ({
            ...p,
            etapas: (p.etapas ?? []).map((e) => {
              const old = e as unknown as { feito?: boolean; status?: ChecklistStatus };
              return { ...e, status: old.status ?? (old.feito ? "OK" : "Pendente") };
            }),
          }));
        }
        return state;
      },
      // Recompute "licença vencendo" alerts on every load so the day countdown
      // (e.g. "vencendo em N dias") stays accurate, not just when a licença is edited.
      onRehydrateStorage: () => (state) => {
        state?.resyncLicencaAlerts();
      },
    }
  )
);
