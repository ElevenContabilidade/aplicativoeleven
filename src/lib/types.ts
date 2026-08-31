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

/** Serviço de interesse comercial de um lead. Além da lista sugerida, o
 *  usuário pode cadastrar serviços novos direto no formulário — por isso
 *  é texto livre, não uma união fixa. */
export type ServicoInteresse = string;

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
  senhaGovBr?: string;
  percentual: number;
  telefone?: string;
  email?: string;
  administrador: boolean;
  representanteLegal?: boolean;
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
  nire?: string;
  senhaPrefeituraPortalNacional?: string;
  linkDrive?: string;
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

export const ONBOARDING_TEMPLATE = [
  "Criar Grupo do WhatsApp com logo do Cliente",
  "Fazer o contrato de prestação de serviços",
  "Verificar se o contrato contábil foi assinado",
  "Fazer o e-CNPJ",
  "Cadastrar na Fortes",
  "Enviar eventos Esocial",
  "Adicionar Cliente no Nibo",
  "Enviar convite Nibo",
  "Enviar Vídeo do Nibo",
  "Adicionar Cliente na Veri",
  "Fazer procuração ECAC",
  "Fazer procuração FGTS",
  "Fazer a opção DET",
  "Cadastrar no banco para emissão de boletos",
  "Cadastrar na prefeitura para emissão de NFSE",
  "Salvar documentos no permanente do NIBO",
  "Salvar documentos no Drive",
  "Marcar Reunião de Integração",
] as const;

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
  servico?: string;
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: "Pago" | "Em aberto" | "Atrasado" | "Negociado" | "Cancelado";
}

export type TipoPessoaRecebimento = "PF" | "PJ";

/** Recebimento avulso, não vinculado a um cadastro de cliente — nome digitado livremente.
 * Quando o CNPJ/CPF bate com um cliente cadastrado, aparece automaticamente no
 * "Histórico de honorários" do perfil dele assim que marcado como Pago. */
export interface Recebimento {
  id: string;
  nome: string;
  cnpjCpf?: string;
  competencia: string;
  servico?: string;
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: "Pago" | "Em aberto" | "Atrasado" | "Negociado" | "Cancelado";
  banco?: string;
  tipoPessoa: TipoPessoaRecebimento;
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

/** Tabela de preços dos serviços que a Eleven vende (Portfólio). */
export interface ServicoPortfolio {
  id: string;
  nome: string;
  valor: number;
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

export type DepartamentoChave = "fiscal" | "contabil" | "pessoal";

export interface NotaDepartamento {
  nota: string;
  atualizadoEm?: string;
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
  notasDepartamentos?: Partial<Record<DepartamentoChave, NotaDepartamento>>;
  numeroFuncionarios?: number;
  leadOrigemId?: string;
  criadoEm: string;
}

// ---------- Licenças e vencimentos ----------

export const LICENCA_STATUS = ["Regular", "Vencendo", "Vencida", "Em renovação"] as const;
export type LicencaStatus = (typeof LICENCA_STATUS)[number];

export interface Licenca {
  id: string;
  clienteId: string;
  nome: string;
  status: LicencaStatus;
  dataEmissao?: string;
  dataVencimento: string;
  documentoId?: string;
  observacao?: string;
}

// ---------- Indicações ----------

export const INDICACAO_STATUS = ["Novo", "Em contato", "Convertido", "Perdido"] as const;
export type IndicacaoStatus = (typeof INDICACAO_STATUS)[number];

export interface Indicacao {
  id: string;
  clienteId: string;
  nomeIndicado: string;
  empresa?: string;
  contato?: string;
  status: IndicacaoStatus;
  data: string;
  observacao?: string;
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

export interface EtapaProcesso {
  id: string;
  descricao: string;
  responsavelId: string;
  inicio: string;
  prazo: string;
  status: ChecklistStatus;
}

/**
 * Checklist padrão de uma abertura de empresa, agrupado pelas mesmas fases
 * do controle societário (Junta Comercial, Receita Federal, Prefeitura,
 * Estado, sistemas internos e demais obrigações).
 */
export const ETAPAS_ABERTURA_EMPRESA = [
  "Viabilidade",
  "DBE",
  "FCN/Integrador",
  "Pagamento Taxa",
  "Registro",
  "Gerar CNPJ",
  "Opção pelo Simples",
  "Procuração ECAC",
  "Inscrição Municipal",
  "Liberar emissão de NFSe",
  "Alvará",
  "Licenças",
  "Inscrição Estadual",
  "DTE/Sintegra",
  "Bombeiro",
  "Certificado Digital",
  "Cadastro no sistema contábil",
  "Cadastro no sistema de gestão",
  "Cadastro no banco (boleto)",
  "Fazer a opção do DET",
  "Fazer procuração FGTS",
  "Fazer contrato de prestação de serviço",
  "Marcar reunião de integração",
  "Adicionar dados do cliente nas planilhas",
  "Guardar documentos no Drive",
  "Enviar eventos eSocial",
  "Enviar DCTFWeb",
] as const;

/** Faixas de colunas de ETAPAS_ABERTURA_EMPRESA, com a cor de cada fase do controle societário. */
export const ETAPAS_ABERTURA_GRUPOS = [
  { label: "Junta Comercial", count: 5, color: "#2E5F7F" },
  { label: "Receita Federal", count: 3, color: "#4A7A8C" },
  { label: "Prefeitura", count: 4, color: "#B4691F" },
  { label: "Estado", count: 3, color: "#7A1F1F" },
  { label: "Demais obrigações", count: 12, color: "#9A5A72" },
] as const;

export type PagamentoProcesso = "Pago" | "Pendente";

export interface ProcessoSocietario {
  id: string;
  clienteId: string;
  tipoServico: string;
  responsavelId: string;
  orgao?: string;
  protocolo?: string;
  dataAbertura: string;
  prazo?: string;
  status: ProcessoSocietarioStatus;
  pendencias?: string;
  observacoes?: string;
  etapas: EtapaProcesso[];
  valorProcesso?: number;
  pagamento?: PagamentoProcesso;
}

// ---------- Parcelamentos ----------

export type StatusEnvioParcelamento = "Enviado" | "Não enviado";

export interface Parcelamento {
  id: string;
  clienteNome: string;
  cnpjCpf?: string; // identifica o cliente do parcelamento (CNPJ ou CPF)
  nome: string;
  quantidadeParcelas?: number; // em quantas X — define por quantos meses o parcelamento se repete
  dataInicio: string; // "YYYY-MM-DD" — mês/ano da 1ª parcela
  observacoes?: string;
  criadoEm: string;
}

/** Um parcelamento existe (e precisa ser enviado) em cada competência dentro de
 * sua faixa de parcelas — este é o status de envio de UMA dessas competências. */
export interface EnvioParcelamento {
  id: string;
  parcelamentoId: string;
  competencia: string; // "YYYY-MM"
  status: StatusEnvioParcelamento;
}

// ---------- Boletos mensais ----------

export type StatusEmissaoBoleto = "Emitido" | "Não emitido";

/** Status de emissão do boleto de UM cliente em UMA competência. Valor e
 * vencimento não ficam salvos aqui — são sempre puxados ao vivo do cadastro
 * financeiro do cliente (client.financeiro), então acompanham qualquer
 * alteração feita lá. */
export interface BoletoMensal {
  id: string;
  clienteId: string;
  competencia: string; // "YYYY-MM"
  status: StatusEmissaoBoleto;
}

// ---------- Certificados digitais ----------

export const CERTIFICADO_STATUS = ["Válido", "Aguardando Renovação", "Vencido"] as const;
export type CertificadoStatus = (typeof CERTIFICADO_STATUS)[number];

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
  documentoId?: string;
  senha?: string;
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
  | "Licenças"
  | "Outros";

export interface Documento {
  id: string;
  clienteId: string;
  nome: string;
  categoria: DocumentoCategoria;
  dataArquivo: string;
  responsavelId: string;
  tamanho: string;
  /** Object URL for files attached during this session (not persisted across reloads). */
  url?: string;
}

// ---------- Notificações ----------

export type NotificationTipo = "urgente" | "certificado" | "comercial" | "financeiro" | "tarefa" | "licenca" | "fiscal";

export interface AppNotification {
  id: string;
  tipo: NotificationTipo;
  titulo: string;
  descricao: string;
  data: string;
  lida: boolean;
  href?: string;
}

// ---------- Checklist de rotinas contábeis ----------

export const ROTINAS_CONTABEIS_MENSAIS = [
  "Receber extratos bancários PDF e OFX",
  "Cobrar dos clientes documentos faltantes",
  "Classificar",
  "Importar DP",
  "Importar Fiscal",
  "Imposto",
  "Conciliar Banco",
  "Conciliar cliente e fornecedores",
  "Validar balancete com cliente",
] as const;

export const ROTINAS_CONTABEIS_ANUAIS = [
  "Balanço",
  "DRE",
  "DLPA",
  "DMPL",
  "Notas Explicativas",
  "Livro Diário",
  "Registro Junta Comercial",
  "Envio SPED ECD",
] as const;

export const CHECKLIST_STATUS = ["OK", "Pendente", "Em andamento", "Dispensada"] as const;
export type ChecklistStatus = (typeof CHECKLIST_STATUS)[number];

export interface ChecklistEntry {
  id: string;
  clienteId: string;
  /** "YYYY-MM" para rotinas mensais, "YYYY" para rotinas anuais. */
  competencia: string;
  rotina: string;
  status: ChecklistStatus;
}

// ---------- Checklist de rotinas fiscais ----------

export const ROTINAS_FISCAIS_MENSAIS = [
  "Importação de Notas",
  "Classificação de documentos fiscais",
  "Fechamento do PGDAS",
  "Envio da guia do DAS",
  "Emissão de livros fiscais",
  "Emissão guia DAE",
  "DeSTDA",
  "EFD-ICMS",
  "EFD-Reinf",
  "GIA-ST",
  "Encerramento ISS",
  "Checar recebimento das guias pelo cliente",
  "Contabilizar movimentos",
  "Exportar pro contábil",
] as const;

/**
 * Obrigação fiscal anual varia por enquadramento tributário — e clientes da
 * área da saúde (tag #Saúde) acumulam a DMED além da obrigação do regime.
 */
export function obrigacaoAnualPorRegime(regime: DadosCadastrais["regimeTributario"]): string {
  if (regime === "MEI") return "DASN-MEI";
  if (regime === "Simples Nacional") return "DEFIS";
  return "ECF";
}

export function rotinasFiscaisAnuais(client: Pick<Client, "dados" | "tags">): string[] {
  const base = obrigacaoAnualPorRegime(client.dados.regimeTributario);
  return client.tags.includes("#Saúde") ? [base, "DMED"] : [base];
}

// ---------- Checklist de rotinas do Departamento Pessoal ----------

export const ROTINAS_PESSOAL_FIXAS = [
  "Solicitar documentação da folha de pagamento",
  "Conferência folha de ponto e variáveis da folha",
  "Processar e enviar recibos/folhas de pagamento",
  "Entrega da DCTFWeb",
  "Emissão e Envio do FGTS",
  "Emissão e Envio do INSS e IRRF",
] as const;

export const ROTINAS_PESSOAL_VARIAVEIS = [
  "Processar admissões",
  "Processar rescisões",
  "Processar férias",
  "Processar benefícios",
  "Processar afastamentos",
  "Emissão e Envio de Quadro de Horários",
  "Emissão e Envio de Folhas de Ponto",
  "Emissão e Envio de escala de revezamento",
  "Classificar",
  "Lançar no sistema",
  "Conciliar Banco",
  "Importar DP",
  "Validar balanço com cliente",
] as const;

/** Obrigação anual do Departamento Pessoal — só se aplica a clientes com folha ativa. */
export const ROTINA_PESSOAL_ANUAL = "DCTFWeb 13ª";

export function possuiFuncionarios(client: Pick<Client, "numeroFuncionarios">): boolean {
  return (client.numeroFuncionarios ?? 0) > 0;
}
