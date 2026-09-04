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
  celular?: string;
  perfil: PerfilEquipe;
  departamentos: Departamento[];
  avatarColor: string;
  ativo: boolean;
  /** Clientes que esse colaborador pode visualizar. Vazio/ausente = vê todos
   * os clientes (padrão); preenchido = fica restrito só a esses. */
  clientesVinculados?: string[];
  historico?: HistoricoAcaoUsuario[];
  /** Convite de acesso ainda não ativado pelo colaborador (senha temporária
   * abaixo). Envio de e-mail real ainda não está configurado — por enquanto
   * a senha é exibida na tela para quem cadastrou repassar manualmente. */
  senhaDefinida?: boolean;
  senhaTemporaria?: string;
}

/** Dados cadastrais e de contato da própria Eleven (o escritório), não de
 * um cliente — exibidos/editados na tela "Dados do escritório". */
export interface DadosEscritorio {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  instagram?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  horarioAtendimento?: string;
}

/** Sistema/ferramenta pago pelo escritório (ex: Domínio Sistemas, Nibo,
 * Certificado A1, portal de algum órgão) — acessos, senha e cobrança
 * mensal, geridos na tela "Dados do escritório". */
export interface SistemaEscritorio {
  id: string;
  nome: string;
  login?: string;
  senha?: string;
  link?: string;
  valorMensal?: number;
  diaVencimento?: number;
  observacoes?: string;
}

// ---------- Contas a pagar ----------

export type StatusContaPagar = "Pago" | "Em aberto";

/** Despesa avulsa lançada direto em Contas a pagar (aluguel, salário,
 * qualquer gasto que não seja um dos sistemas cadastrados). */
export interface DespesaAvulsa {
  id: string;
  descricao: string;
  categoria?: string;
  valor: number;
  vencimento: string;
  status: StatusContaPagar;
  dataPagamento?: string;
}

/** Status de pagamento mensal de um sistema/ferramenta (SistemaEscritorio)
 * em Contas a pagar — um registro por sistema+competência. */
export interface PagamentoSistemaMensal {
  id: string;
  sistemaId: string;
  competencia: string;
  status: StatusContaPagar;
  dataPagamento?: string;
}

export interface HistoricoAcaoUsuario {
  id: string;
  acao: string;
  autor: string;
  data: string;
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
  /** Só faz sentido para regime MEI — libera as rotinas fiscais/contábeis de
   * quem normalmente é dispensado delas (PGDAS, DAS, EFDs, balancete etc.). */
  contabilidadeRegular?: boolean;
  /** Só faz sentido para regime MEI — libera as rotinas mensais fixas/variáveis
   * do Departamento Pessoal para quem tem folha de pagamento. */
  possuiFolhaMei?: boolean;
  /** Marcado quando este cliente é de um parceiro (outro escritório) e a
   * Eleven presta apenas alguns setores para ele — os demais checklists
   * (Fiscal/Contábil/Departamento Pessoal) não listam esse cliente. */
  clienteParceiro?: boolean;
  nomeParceiro?: string;
  setoresAtendidos?: DepartamentoChave[];
  /** Marcado quando este cadastro nasceu do fluxo rápido "novo cliente" do
   * Societário (só nome, sem os demais dados) — fica de fora da tela de
   * Clientes até alguém completar o cadastro de verdade lá. */
  criadoViaSocietario?: boolean;
  /** Libera o cliente nos controles de Férias, 13º salário e Rescisão do
   * Departamento Pessoal — sem isso marcado, o cliente não aparece lá. */
  possuiFuncionarios?: boolean;
}

export interface OnboardingChecklistItem {
  id: string;
  label: string;
  concluido: boolean;
  dataConclusao?: string;
}

export const ONBOARDING_TEMPLATE = [
  "Cadastrar no aplicativo de gestão",
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

/** Um cliente normal é atendido por todos os setores. Cliente de parceiro só
 * é atendido nos setores marcados em "setoresAtendidos" — os checklists dos
 * demais setores nem listam esse cliente. */
export function setorAtendidoPelaEleven(client: Pick<Client, "dados">, setor: DepartamentoChave): boolean {
  if (!client.dados.clienteParceiro) return true;
  return client.dados.setoresAtendidos?.includes(setor) ?? false;
}

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
 * vencimento vêm por padrão do cadastro financeiro do cliente (client.financeiro),
 * mas podem ser ajustados aqui para aquela competência específica (valor/vencimento
 * pontuais). "removido" tira o boleto da lista daquele mês (ex: cliente não precisou). */
export interface BoletoMensal {
  id: string;
  clienteId: string;
  competencia: string; // "YYYY-MM"
  status: StatusEmissaoBoleto;
  valor?: number;
  vencimento?: string; // "YYYY-MM-DD"
  removido?: boolean;
  /** Marcado quando o cliente efetivamente pagou o boleto. Alimenta o
   * dashboard do Financeiro (some para "Recebido" em vez de "Em aberto"). */
  recebido?: boolean;
  dataRecebimento?: string; // "YYYY-MM-DD"
  /** Valor efetivamente recebido — pode diferir de "valor" por juros/multa ou desconto. */
  valorRecebido?: number;
  /** Banco em que o boleto caiu — alimenta o filtro de banco do Financeiro. */
  banco?: string;
}

// ---------- NFSe mensal ----------

export type StatusEmissaoNfse = "Emitida" | "Não emitida";

/** Controle de emissão da nota fiscal de serviço eletrônica que o escritório
 * emite pro cliente todo mês. Valor vem por padrão do cadastro financeiro do
 * cliente (client.financeiro), mas pode ser ajustado por competência. */
export interface NotaFiscalMensal {
  id: string;
  clienteId: string;
  competencia: string; // "YYYY-MM"
  status: StatusEmissaoNfse;
  valor?: number;
  numeroNota?: string;
  removido?: boolean;
}

// ---------- Recebimentos de parceiros ----------

export type StatusPagamentoParceiro = "Pago" | "Em aberto";

/** Controle mensal do que os clientes de parceiro pagam via PIX — não entram
 * em Boletos. Valor vem por padrão do cadastro financeiro do cliente
 * (client.financeiro.valorMensal), mas pode ser ajustado por competência. */
export interface RecebimentoParceiroMensal {
  id: string;
  clienteId: string;
  competencia: string; // "YYYY-MM"
  status: StatusPagamentoParceiro;
  valor?: number;
  dataPagamento?: string; // "YYYY-MM-DD"
  removido?: boolean;
  /** Banco em que o PIX caiu. */
  banco?: string;
  tipoPessoa?: TipoPessoaRecebimento;
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
  | "Extratos bancários"
  | "Notas fiscais"
  | "Boletos"
  | "Outros";

export interface Documento {
  id: string;
  clienteId: string;
  nome: string;
  categoria: DocumentoCategoria;
  dataArquivo: string;
  responsavelId: string;
  tamanho: string;
  /** Link do arquivo no Google Drive do escritório. */
  url?: string;
}

// ---------- Checklist mensal de documentos do cliente ----------
// (o que o escritório espera receber todo mês, tipo por tipo, tipo o
// checklist de rotinas fiscais só que do lado do Portal do Cliente)

export type StatusEnvioMensal = "Pendente" | "Em andamento" | "Concluído" | "Nada a enviar";
export const STATUS_ENVIO_MENSAL: StatusEnvioMensal[] = ["Pendente", "Em andamento", "Concluído", "Nada a enviar"];

export interface TipoDocumentoRecorrente {
  id: string;
  clienteId: string;
  nome: string;
  ativo: boolean;
  criadoEm: string;
}

export interface EnvioMensalDocumento {
  /** `${tipoId}-${competencia}` */
  id: string;
  clienteId: string;
  tipoId: string;
  /** "YYYY-MM" */
  competencia: string;
  status: StatusEnvioMensal;
  documentoId?: string;
}

// ---------- Painel de pendências (o que o escritório aguarda do cliente) ----------

export type PendenciaTipo = "Documento" | "Assinatura" | "Informação" | "Outro";
export type PendenciaStatus = "Pendente" | "Concluída";

export interface Pendencia {
  id: string;
  clienteId: string;
  titulo: string;
  tipo: PendenciaTipo;
  prazo?: string;
  status: PendenciaStatus;
  responsavelId?: string;
  criadoEm: string;
}

// ---------- Assinatura eletrônica (Autentique) ----------

export type StatusAssinatura = "Enviado" | "Assinado" | "Recusado" | "Erro";

export interface SignatarioContrato {
  publicId?: string;
  nome: string;
  email: string;
  assinado: boolean;
  recusado: boolean;
  dataAssinatura?: string;
  linkAssinatura?: string;
}

/** Envio de um contrato pra assinatura eletrônica via Autentique. O PDF em si
 * fica guardado só do lado da Autentique (não duplicamos no localStorage) —
 * aqui a gente rastreia só o id do documento lá e o status de cada
 * signatário, atualizado sob demanda pela rota de status. */
export interface ContratoAssinatura {
  id: string;
  clienteId: string;
  nomeArquivo: string;
  documentId: string;
  status: StatusAssinatura;
  signatarios: SignatarioContrato[];
  sandbox: boolean;
  /** Link do PDF assinado na Autentique, disponível assim que todo mundo assina. */
  pdfAssinadoUrl?: string;
  erro?: string;
  criadoEm: string;
  atualizadoEm: string;
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
  "Gerar DAS MEI",
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

/** Rotinas exclusivas de quem apura pelo regime normal (PGDAS, DAS, EFDs,
 * livros fiscais...) — um MEI "puro" não faz nada disso, só quando o
 * cadastro marca "contabilidade regular" (cliente que, mesmo sendo MEI,
 * mantém contabilidade completa). */
const ROTINAS_EXCLUSIVAS_REGIME_NORMAL = [
  "Fechamento do PGDAS",
  "Envio da guia do DAS",
  "Emissão de livros fiscais",
  "DeSTDA",
  "EFD-ICMS",
  "EFD-Reinf",
  "GIA-ST",
  "Encerramento ISS",
] as const;

/** Rotinas fiscais mensais aplicáveis ao cliente, seguindo o regime tributário
 * cadastrado em Clientes: "Gerar DAS MEI" só entra para quem está no MEI;
 * as rotinas do regime normal (PGDAS, DAS, EFDs etc.) só entram para o MEI
 * se o cadastro marcar "contabilidade regular" — sem isso, ficam travadas. */
export function rotinasFiscaisMensaisFor(client: Pick<Client, "dados">): string[] {
  const isMei = client.dados.regimeTributario === "MEI";
  if (!isMei) return ROTINAS_FISCAIS_MENSAIS.filter((r) => r !== "Gerar DAS MEI");
  if (client.dados.contabilidadeRegular) return [...ROTINAS_FISCAIS_MENSAIS];
  return ROTINAS_FISCAIS_MENSAIS.filter((r) => !(ROTINAS_EXCLUSIVAS_REGIME_NORMAL as readonly string[]).includes(r));
}

/** Rotinas contábeis (mensais ou anuais) aplicáveis ao cliente — um MEI só
 * tem contabilidade formal (e, portanto, essas rotinas) quando o cadastro
 * marca "contabilidade regular"; sem isso, nenhuma rotina contábil se aplica. */
export function rotinasContabeisFor(client: Pick<Client, "dados">, rotinas: readonly string[]): string[] {
  if (client.dados.regimeTributario === "MEI" && !client.dados.contabilidadeRegular) return [];
  return [...rotinas];
}

/** Rotinas mensais fixas/variáveis do Departamento Pessoal aplicáveis ao
 * cliente — um MEI só tem folha de pagamento (e, portanto, essas rotinas)
 * quando o cadastro marca "possui folha"; sem isso, nenhuma se aplica. */
export function rotinasPessoalMensalFor(client: Pick<Client, "dados">, rotinas: readonly string[]): string[] {
  if (client.dados.regimeTributario === "MEI" && !client.dados.possuiFolhaMei) return [];
  return [...rotinas];
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

// ---------- Checklist mensal exclusivo do MEI ----------

export const ROTINAS_MEI = [
  "Emissão de DAS MEI",
  "Solicitar extratos aos cliente",
  "Conferir Notas Emitidas",
  "Preencher a Planilha",
  "Gerar o relatório",
] as const;

// ---------- Funcionários (Férias, 13º e Rescisão) ----------

export type TipoFuncionario = "CLT" | "MEI" | "Doméstico";

/** Um período aquisitivo de férias já concluído (férias programadas e
 * confirmadas) — histórico usado pra saber em que período aquisitivo o
 * funcionário está agora (índice = historicoFerias.length). */
export interface FeriasRegistro {
  indice: number;
  periodoInicio: string;
  periodoFim: string;
  feriasInicio: string;
  feriasFim: string;
}

export interface Decimo13Registro {
  ano: string;
  primeiraParcelaPaga: boolean;
  segundaParcelaPaga: boolean;
}

export const RESCISAO_CHECKLIST = [
  "03 vias Rescisão Contratual (2 do funcionário, 1 da empresa)",
  "02 vias Aviso (1 do funcionário, 1 da empresa)",
  "01 via Ficha do Funcionário (empresa)",
  "02 vias Cálculo de médias (1 do funcionário, 1 da empresa)",
  "01 via Ocorrências (funcionário)",
  "02 vias Carta de recomendação (funcionário)",
  "03 vias PPP (2 do funcionário, 1 da empresa — Técnico de segurança do trabalho)",
  "Extrato do FGTS atualizado (funcionário e empresa)",
  "02 vias ASO Demissional (1 da empresa, 1 do funcionário — funcionário precisa fazer)",
  "01 via Comprovante de rendimentos para IR (funcionário)",
  "Seguro-desemprego (canhoto com a empresa, restante com o funcionário)",
  "Multa FGTS",
] as const;

export interface RescisaoChecklistItem {
  id: string;
  label: string;
  concluido: boolean;
}

export interface Rescisao {
  dataDesligamento: string;
  motivo?: string;
  checklist: RescisaoChecklistItem[];
}

export interface Funcionario {
  id: string;
  clienteId: string;
  nome: string;
  dataAdmissao: string;
  tipo: TipoFuncionario;
  observacoes?: string;
  ativo: boolean;
  historicoFerias: FeriasRegistro[];
  /** Datas programadas pro período aquisitivo em aberto (ainda não
   * confirmadas em historicoFerias). */
  feriasProgramadasInicio?: string;
  feriasProgramadasFim?: string;
  decimosTerceiros: Decimo13Registro[];
  rescisao?: Rescisao;
}
