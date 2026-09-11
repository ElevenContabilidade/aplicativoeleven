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

// ---------- Gestão do CRC (Conselho Regional de Contabilidade) ----------

/** Um dos dois registros no CRC que o escritório mantém: o profissional
 * (pessoa física, o(a) contador(a) responsável) e o da empresa contábil. */
export interface CrcRegistroInfo {
  numero?: string;
  dataRegistro?: string;
  codigoAcesso?: string;
  linkDrive?: string;
  /** Site do CRC de origem usado pra comunicar exercício profissional em
   * outra UF — só faz sentido no registro pessoal (é o "portal do CRC de
   * origem do registro" citado no passo a passo da tela de UFs). */
  linkPortalUf?: string;
  /** Senha usada especificamente nesse site de comunicação de UF — separada
   * de `codigoAcesso` de propósito: são logins diferentes (o código de
   * acesso é do registro em si, essa é do portal de comunicação). */
  senhaComunicacaoUf?: string;
}

/** Comunicação de exercício profissional numa UF diferente da sede — o
 * CRC exige isso quando o escritório presta serviço em outro estado.
 * `pessoalData`/`empresaData` ficam vazios até serem comunicados. */
export interface CrcUfComunicada {
  id: string;
  estado: string;
  pessoalData?: string;
  empresaData?: string;
}

export type CrcTipoRegistro = "pessoal" | "empresa";

export interface CrcAnuidade {
  id: string;
  tipo: CrcTipoRegistro;
  ano: string;
  valor: number;
  status: StatusContaPagar;
  dataPagamento?: string;
}

export interface CrcEleicao {
  id: string;
  ano: string;
  descricao?: string;
  data?: string;
  link?: string;
}

export interface CrcDeclaracaoCoaf {
  id: string;
  ano: string;
  status: "Enviada" | "Pendente";
  dataEnvio?: string;
  link?: string;
}

// ---------- Scripts (mensagens prontas por departamento) ----------

/** Departamento é livre (a Kauane cria/renomeia os próprios), não usa o
 * enum fixo `DepartamentoChave` — cada escritório organiza do seu jeito. */
export interface ScriptDepartamento {
  id: string;
  nome: string;
}

export interface Script {
  id: string;
  departamentoId: string;
  titulo: string;
  /** Vazio = "sem mensagem ainda" na listagem. */
  mensagem?: string;
}

/** Módulo "Controle de conteúdo" — calendário/Kanban de posts de redes
 * sociais (substitui a planilha de Reels/Carrossel que a Kauane já usava). */
export const CONTEUDO_FORMATOS = ["Reels", "Carrossel", "Story", "Post estático", "Vídeo longo"] as const;
export type ConteudoFormato = (typeof CONTEUDO_FORMATOS)[number];

export const CONTEUDO_STATUS = ["A fazer", "Em andamento", "Concluído"] as const;
export type ConteudoStatus = (typeof CONTEUDO_STATUS)[number];

export interface ConteudoImagem {
  id: string;
  nome: string;
  /** Guardada como data URL direto no registro (sem bucket de storage
   * configurado ainda) — ok pro volume de imagens de referência de um
   * calendário de conteúdo, mas não é o lugar pra vídeos/arquivos grandes. */
  dataUrl: string;
}

export interface ConteudoPost {
  id: string;
  data: string;
  formato: ConteudoFormato;
  tema: string;
  status: ConteudoStatus;
  /** Como o conteúdo vai ser organizado/roteirizado. */
  organizacao?: string;
  /** Link de onde está o material de apoio (doc, conversa do Claude, etc.). */
  linkDocumento?: string;
  imagens: ConteudoImagem[];
  visualizacoes?: number;
  salvamentos?: number;
  compartilhamentos?: number;
  comentarios?: number;
  observacoes?: string;
  responsavelId?: string;
}

/** Setor interno do escritório que usa um sistema/ferramenta — eixo
 * diferente do `DepartamentoChave` (que descreve setor de atendimento ao
 * CLIENTE); aqui é só pra organizar a tela "Sistemas e ferramentas" por
 * quem usa cada ferramenta dentro da Eleven. */
export const SETORES_SISTEMA = ["Comercial", "Administrativo", "Contábil", "Fiscal", "Financeiro", "Parceria"] as const;
export type SetorSistema = (typeof SETORES_SISTEMA)[number];

export type SituacaoSistema = "Ativo" | "Cancelado";

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
  setores?: SetorSistema[];
  /** Ausente = Ativo (registros antigos, de antes desse campo existir,
   * continuam contando como ativos). */
  situacao?: SituacaoSistema;
  valorImplementacao?: number;
  formaCobranca?: string;
  telefoneSuporte?: string;
  emailSuporte?: string;
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
  regimeTributario: "MEI" | "Simples Nacional" | "Lucro Presumido" | "Lucro Real" | "Doméstica";
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
  /** Data do último reajuste de honorário aplicado — quando ausente, o
   * início do contrato vale como referência. Alimenta o alerta de "reajuste
   * pendente" (12+ meses sem reajustar) em Alertas/Relatórios. */
  dataUltimoReajuste?: string;
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

/** Um cliente só entra num checklist de rotinas (Fiscal/Contábil/Pessoal) a
 * partir da competência em que o contrato começou — cliente que só entrou
 * em setembro/2026 não deve aparecer nas rotinas de meses ou anos
 * anteriores. `competencia` pode ser "YYYY-MM" (mensal) ou "YYYY" (anual). */
export function clienteAtivoNaCompetencia(client: Pick<Client, "financeiro">, competencia: string): boolean {
  const inicio = client.financeiro.inicioContrato;
  if (!inicio) return true;
  return competencia >= inicio.slice(0, competencia.length);
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

export const OBLIGATION_STATUS: ObligationStatus[] = [
  "A fazer",
  "Em andamento",
  "Aguardando informação",
  "Em atraso",
  "Concluído",
  "Não aplicável",
];

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

// ---------- Faturamento e impostos do cliente ----------

/** Faturamento e imposto pago pelo cliente numa competência — lançado à mão
 * pela equipe a partir da guia do mês (PGDAS no Simples Nacional, DAS no MEI
 * etc.), pra alimentar o dashboard de faturamento no Portal do Cliente. */
export interface FaturamentoMensal {
  id: string;
  clienteId: string;
  competencia: string; // "YYYY-MM"
  faturamento?: number;
  imposto?: number;
  observacao?: string;
  /** Link do PGDAS/guia lido automaticamente que gerou este lançamento —
   * fica salvo no Drive do cliente (categoria Guias) pra conferência depois. */
  pgdasUrl?: string;
}

// ---------- Guias fiscais (DARF, GPS, DAS) ----------

export const TIPOS_GUIA_FISCAL = ["DARF", "GPS", "DAS"] as const;
export type TipoGuiaFiscal = (typeof TIPOS_GUIA_FISCAL)[number];

/** Guia de recolhimento (DARF/GPS/DAS) lida automaticamente do PDF ou
 * lançada à mão — fica disponível pro cliente ver no Portal e recalcular
 * o valor atualizado se pagar depois do vencimento (multa de mora). */
export interface GuiaFiscal {
  id: string;
  clienteId: string;
  tipo: TipoGuiaFiscal;
  competencia: string; // "YYYY-MM"
  vencimento: string; // "YYYY-MM-DD"
  valorOriginal: number;
  numeroDocumento?: string;
  observacao?: string;
  /** Link do PDF da guia, salvo no Drive do cliente (categoria Guias). */
  arquivoUrl?: string;
  paga?: boolean;
  dataPagamento?: string;
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

/** Valor extra que um parceiro (não um cliente específico) paga num mês —
 * ex: cobrança à parte por um sistema usado só por aquele parceiro. Fica
 * agrupado dentro do total do parceiro em Parceiros, mas fora do que vem
 * do cadastro de cada cliente. */
export interface ExtraParceiro {
  id: string;
  nomeParceiro: string;
  competencia: string; // "YYYY-MM"
  descricao: string;
  valor: number;
  status: StatusPagamentoParceiro;
  dataPagamento?: string; // "YYYY-MM-DD"
  /** Banco em que o PIX caiu. */
  banco?: string;
  tipoPessoa?: TipoPessoaRecebimento;
}

// ---------- Certificados digitais ----------

export const CERTIFICADO_STATUS = ["Válido", "Aguardando Renovação", "Vencido"] as const;
export type CertificadoStatus = (typeof CERTIFICADO_STATUS)[number];

const DIAS_AGUARDANDO_RENOVACAO_CERTIFICADO = 15;

/** Status do certificado calculado na hora a partir do vencimento — não é
 * mais um campo escolhido à mão: vencido (já passou), aguardando renovação
 * (faltam 15 dias ou menos) ou válido (fora dessas duas janelas). */
export function statusAutomaticoCertificado(dataVencimento: string): CertificadoStatus {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(`${dataVencimento}T00:00:00`);
  const dias = Math.round((vencimento.getTime() - hoje.getTime()) / 86_400_000);
  if (dias < 0) return "Vencido";
  if (dias <= DIAS_AGUARDANDO_RENOVACAO_CERTIFICADO) return "Aguardando Renovação";
  return "Válido";
}

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
  /** Em qual pasta/categoria o documento enviado pelo cliente cai — sem
   * isso definido, cai em "Outros" (pasta Docs Empresa). */
  categoria?: DocumentoCategoria;
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

// ---------- Log de auditoria ----------

/** Um evento de "quem fez o quê" no sistema, pra tela de Auditoria — cobre
 * as ações de maior risco (exclusões, ciclo de vida de cliente/colaborador,
 * mudanças de honorário e de permissão), não toda edição de campo. */
export interface AuditLogEntry {
  id: string;
  data: string; // ISO datetime
  autor: string;
  acao: string;
  modulo: string;
  detalhe?: string;
}

// ---------- Notificações ----------

export type NotificationTipo =
  | "urgente"
  | "certificado"
  | "comercial"
  | "financeiro"
  | "tarefa"
  | "licenca"
  | "fiscal"
  | "documento"
  | "reajuste";

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
  if (regime === "Doméstica") return "—";
  return "ECF";
}

/** Empregador doméstico não tem obrigação fiscal anual (nem DEFIS/DASN-MEI/ECF
 * — é regido só pelo eSocial doméstico, mensal, à parte desse checklist). */
export function rotinasFiscaisAnuais(client: Pick<Client, "dados" | "tags">): string[] {
  if (client.dados.regimeTributario === "Doméstica") return [];
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
 * cadastrado em Clientes: as rotinas do regime normal (PGDAS, DAS, EFDs etc.)
 * só entram para o MEI se o cadastro marcar "contabilidade regular" — sem
 * isso, ficam travadas. A emissão do DAS MEI em si tem módulo próprio (MEI),
 * não entra nesse checklist. */
export function rotinasFiscaisMensaisFor(client: Pick<Client, "dados">): string[] {
  if (client.dados.regimeTributario === "Doméstica") return [];
  const isMei = client.dados.regimeTributario === "MEI";
  if (isMei && !client.dados.contabilidadeRegular) {
    return ROTINAS_FISCAIS_MENSAIS.filter((r) => !(ROTINAS_EXCLUSIVAS_REGIME_NORMAL as readonly string[]).includes(r));
  }
  return [...ROTINAS_FISCAIS_MENSAIS];
}

/** Rotinas contábeis (mensais ou anuais) aplicáveis ao cliente — um MEI só
 * tem contabilidade formal (e, portanto, essas rotinas) quando o cadastro
 * marca "contabilidade regular"; sem isso, nenhuma rotina contábil se aplica.
 * Empregador doméstico (pessoa física) nunca tem contabilidade formal. */
export function rotinasContabeisFor(client: Pick<Client, "dados">, rotinas: readonly string[]): string[] {
  if (client.dados.regimeTributario === "Doméstica") return [];
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
