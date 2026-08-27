// Domain types for the Eleven Hub CRM / gestão platform.

export type Departamento =
  | "Comercial"
  | "Relacionamento"
  | "Fiscal"
  | "Contábil"
  | "Pessoal"
  | "Societário"
  | "Financeiro"
  | "Atendimento";

export type PerfilEquipe =
  | "Administrador"
  | "Gestor"
  | "Comercial"
  | "Fiscal"
  | "Contábil"
  | "Departamento Pessoal"
  | "Societário"
  | "Financeiro"
  | "Atendimento";

export interface TeamMember {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilEquipe;
  departamentos: Departamento[];
  avatarColor: string;
  ativo: boolean;
}

// ---------- Comercial / CRM ----------

export const LEAD_STAGES = [
  "Lead recebido",
  "Primeiro contato",
  "Contato realizado",
  "Qualificação",
  "Reunião agendada",
  "Reunião realizada",
  "Proposta enviada",
  "Negociação",
  "Aguardando retorno",
  "Fechado",
  "Perdido",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export type LeadOrigem =
  | "Instagram"
  | "Google"
  | "Site"
  | "WhatsApp"
  | "Indicação"
  | "Prospecção ativa"
  | "Parceiro"
  | "Evento"
  | "Outro";

export type ServicoInteresse =
  | "Contabilidade mensal"
  | "Abertura de empresa"
  | "Alteração empresarial"
  | "Regularização"
  | "Desenquadramento MEI"
  | "Planejamento tributário"
  | "Departamento pessoal"
  | "Certificado digital"
  | "Consultoria"
  | "Outros";

export interface LeadHistoricoEntry {
  id: string;
  data: string;
  autor: string;
  descricao: string;
  deStage?: LeadStage;
  paraStage?: LeadStage;
}

export interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  cpf?: string;
  cnpj?: string;
  telefone: string;
  whatsapp?: string;
  email?: string;
  cidade: string;
  estado: string;

  segmento?: string;
  profissao?: string;
  atividade?: string;
  regimeTributarioAtual?: string;
  faturamentoEstimado?: number;
  numeroFuncionarios?: number;

  servicosInteresse: ServicoInteresse[];
  origem: LeadOrigem;

  stage: LeadStage;
  responsavelId: string;
  valorEstimado: number;
  proximaAcao?: string;
  dataUltimoContato: string;
  dataEntrada: string;

  historico: LeadHistoricoEntry[];
}

// ---------- Cliente 360 ----------

export const CLIENT_STATUS = [
  "Lead",
  "Em negociação",
  "Onboarding",
  "Implantação",
  "Ativo",
  "Com pendência",
  "Suspenso",
  "Em processo de cancelamento",
  "Encerrado",
] as const;
export type ClientStatus = (typeof CLIENT_STATUS)[number];

export interface Socio {
  id: string;
  nome: string;
  cpf: string;
  percentual: number;
  telefone?: string;
  email?: string;
  administrador: boolean;
  dataEntrada: string;
}

export interface Contato {
  id: string;
  nome: string;
  papel: "Financeiro" | "Administrativo" | "Sócio" | "RH" | "Outro";
  telefone?: string;
  email?: string;
}

export interface Responsaveis {
  comercial?: string;
  relacionamento?: string;
  fiscal?: string;
  contabil?: string;
  pessoal?: string;
  societario?: string;
  financeiro?: string;
}

export interface DadosCadastrais {
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  cnaePrincipal: string;
  cnaesSecundarios: string[];
  naturezaJuridica: string;
  dataAbertura: string;
  capitalSocial: number;
  regimeTributario: "MEI" | "Simples Nacional" | "Lucro Presumido" | "Lucro Real";
  municipio: string;
  estado: string;
  endereco: string;
}

export interface OnboardingChecklistItem {
  id: string;
  label: string;
  concluido: boolean;
  dataConclusao?: string;
}

export interface FinanceiroCliente {
  valorMensal: number;
  vencimentoDia: number;
  formaPagamento: string;
  inicioContrato: string;
  reajuste?: string;
  statusFinanceiro: "Pago" | "Em aberto" | "Atrasado" | "Negociado" | "Cancelado";
}

export interface HistoricoFinanceiro {
  id: string;
  competencia: string;
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: "Pago" | "Em aberto" | "Atrasado" | "Negociado" | "Cancelado";
}

export interface ServicoExtra {
  id: string;
  servico: string;
  clienteId: string;
  valor: number;
  responsavelId: string;
  data: string;
  pagamento?: string;
  status: "Pago" | "Em aberto" | "Atrasado" | "Negociado" | "Cancelado";
}

export interface Anotacao {
  id: string;
  clienteId: string;
  autor: string;
  data: string;
  texto: string;
  marcador?: "atencao" | "estrategico" | "oportunidade" | "documento" | "urgente";
}

export interface TimelineEvent {
  id: string;
  clienteId: string;
  data: string;
  autor: string;
  tipo: "ligacao" | "mensagem" | "reuniao" | "email" | "solicitacao" | "tarefa" | "documento" | "crm";
  descricao: string;
}

export interface Client {
  id: string;
  status: ClientStatus;
  dados: DadosCadastrais;
  socios: Socio[];
  contatos: Contato[];
  responsaveis: Responsaveis;
  segmento: string;
  tags: string[];
  financeiro: FinanceiroCliente;
  historicoFinanceiro: HistoricoFinanceiro[];
  onboarding: OnboardingChecklistItem[];
  leadOrigemId?: string;
  criadoEm: string;
}

// ---------- Tarefas ----------

export type TaskPrioridade = "Baixa" | "Normal" | "Alta" | "Urgente";
export type TaskStatus =
  | "Não iniciada"
  | "Em andamento"
  | "Aguardando cliente"
  | "Aguardando órgão"
  | "Em análise"
  | "Concluída"
  | "Cancelada";

export interface Subtask {
  id: string;
  titulo: string;
  concluida: boolean;
}

export interface TaskComment {
  id: string;
  autor: string;
  data: string;
  texto: string;
}

export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  clienteId?: string;
  departamento: Departamento;
  responsavelId: string;
  prioridade: TaskPrioridade;
  prazo: string;
  status: TaskStatus;
  recorrencia?: "Mensal" | "Semanal" | "Anual" | "Nenhuma";
  subtarefas: Subtask[];
  comentarios: TaskComment[];
}

// ---------- Obrigações ----------

export type ObligationStatus =
  | "A fazer"
  | "Em andamento"
  | "Concluído"
  | "Não aplicável"
  | "Aguardando informação"
  | "Em atraso";

export interface Obligation {
  id: string;
  tipo: string;
  clienteId: string;
  competencia: string;
  responsavelId: string;
  vencimento: string;
  status: ObligationStatus;
  dataConclusao?: string;
  protocolo?: string;
  observacoes?: string;
}

// ---------- Societário ----------

export type ProcessoSocietarioStatus =
  | "Solicitado"
  | "Documentação"
  | "Protocolo"
  | "Em análise"
  | "Exigência"
  | "Aprovado"
  | "Finalizado";

export interface ProcessoSocietario {
  id: string;
  clienteId: string;
  tipoServico: string;
  responsavelId: string;
  orgao: string;
  protocolo?: string;
  dataAbertura: string;
  prazo: string;
  status: ProcessoSocietarioStatus;
  pendencias?: string;
  observacoes?: string;
}

// ---------- Certificados digitais ----------

export type CertificadoStatus =
  | "Agendamento solicitado"
  | "Agendamento realizado"
  | "Aguardando validação"
  | "Validado"
  | "Certificado aprovado"
  | "Entregue"
  | "Renovação próxima"
  | "Vencido";

export interface Certificado {
  id: string;
  clienteId: string;
  documento: string; // CPF/CNPJ
  tipo: "e-CPF A1" | "e-CNPJ A1" | "e-CPF A3" | "e-CNPJ A3";
  dataEmissao?: string;
  dataValidacao?: string;
  dataVencimento: string;
  protocolo?: string;
  status: CertificadoStatus;
  valor: number;
  formaPagamento?: string;
  responsavelId: string;
}

// ---------- Documentos ----------

export type DocumentoCategoria =
  | "Contratos"
  | "Documentos societários"
  | "Certificados"
  | "Procurações"
  | "Guias"
  | "Folha"
  | "Fiscal"
  | "Contábil"
  | "Relatórios"
  | "Comprovantes"
  | "Outros";

export interface Documento {
  id: string;
  clienteId: string;
  nome: string;
  categoria: DocumentoCategoria;
  dataArquivo: string;
  responsavelId: string;
  tamanho: string;
}

// ---------- Notificações ----------

export type NotificationTipo = "urgente" | "certificado" | "comercial" | "financeiro" | "tarefa";

export interface AppNotification {
  id: string;
  tipo: NotificationTipo;
  titulo: string;
  descricao: string;
  data: string;
  lida: boolean;
  href?: string;
}
