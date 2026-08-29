import { ETAPAS_ABERTURA_EMPRESA } from "@/lib/types";
import type {
  TeamMember,
  Lead,
  Client,
  Task,
  Obligation,
  ProcessoSocietario,
  Certificado,
  Documento,
  AppNotification,
  Anotacao,
  TimelineEvent,
  ServicoExtra,
  Licenca,
  Indicacao,
  EtapaProcesso,
  ChecklistStatus,
} from "@/lib/types";

const AVATAR_COLORS = ["#5C1420", "#8A2F3E", "#B4791F", "#3E6B8A", "#2E7D53", "#711F2C"];

export const TEAM: TeamMember[] = [
  { id: "u1", nome: "Kauane Gomes", email: "kauane@eleven.com.br", perfil: "Administrador", departamentos: ["Comercial", "Relacionamento", "Financeiro"], avatarColor: AVATAR_COLORS[0], ativo: true },
  { id: "u2", nome: "Isabel Ramos (Bel)", email: "bel@eleven.com.br", perfil: "Gestor", departamentos: ["Fiscal", "Contábil"], avatarColor: AVATAR_COLORS[1], ativo: true },
  { id: "u3", nome: "Rafael Souza", email: "rafael@eleven.com.br", perfil: "Comercial", departamentos: ["Comercial"], avatarColor: AVATAR_COLORS[2], ativo: true },
  { id: "u4", nome: "Marina Duarte", email: "marina@eleven.com.br", perfil: "Fiscal", departamentos: ["Fiscal"], avatarColor: AVATAR_COLORS[3], ativo: true },
  { id: "u5", nome: "Diego Alves", email: "diego@eleven.com.br", perfil: "Contábil", departamentos: ["Contábil"], avatarColor: AVATAR_COLORS[4], ativo: true },
  { id: "u6", nome: "Priscila Nunes", email: "priscila@eleven.com.br", perfil: "Departamento Pessoal", departamentos: ["Pessoal"], avatarColor: AVATAR_COLORS[5], ativo: true },
  { id: "u7", nome: "Thiago Farias", email: "thiago@eleven.com.br", perfil: "Societário", departamentos: ["Societário"], avatarColor: AVATAR_COLORS[0], ativo: true },
  { id: "u8", nome: "Camila Rocha", email: "camila@eleven.com.br", perfil: "Financeiro", departamentos: ["Financeiro"], avatarColor: AVATAR_COLORS[1], ativo: true },
  { id: "u9", nome: "João Pedro Lima", email: "joao@eleven.com.br", perfil: "Atendimento", departamentos: ["Atendimento", "Relacionamento"], avatarColor: AVATAR_COLORS[2], ativo: true },
];

export function teamName(id: string) {
  return TEAM.find((t) => t.id === id)?.nome ?? "—";
}
export function teamMember(id: string) {
  return TEAM.find((t) => t.id === id);
}

function iso(daysFromToday: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

// ---------------- Leads ----------------

export const LEADS: Lead[] = [
  { id: "l1", nome: "Marcos Vinícius Teixeira", empresa: "Clínica Vitalis Odonto", telefone: "(11) 98211-4432", whatsapp: "(11) 98211-4432", email: "marcos@vitalisodonto.com.br", cidade: "São Paulo", estado: "SP", segmento: "Clínica odontológica", profissao: "Dentista", regimeTributarioAtual: "Simples Nacional", faturamentoEstimado: 42000, numeroFuncionarios: 4, servicosInteresse: ["Contabilidade mensal", "Departamento pessoal"], origem: "Instagram", stage: "Lead recebido", responsavelId: "u3", valorEstimado: 890, proximaAcao: "Ligar para qualificar", dataUltimoContato: iso(-1), dataEntrada: iso(-1), historico: [{ id: "h1", data: iso(-1), autor: "Rafael Souza", descricao: "Lead recebido via Instagram Ads" }] },
  { id: "l2", nome: "Fernanda Cabral", empresa: "Cabral Estética Avançada", telefone: "(21) 99044-1187", email: "fernanda@cabralestetica.com", cidade: "Niterói", estado: "RJ", segmento: "Outros profissionais da saúde", profissao: "Esteticista", regimeTributarioAtual: "MEI", faturamentoEstimado: 8000, servicosInteresse: ["Desenquadramento MEI", "Contabilidade mensal"], origem: "Google", stage: "Primeiro contato", responsavelId: "u3", valorEstimado: 350, proximaAcao: "Enviar mensagem no WhatsApp", dataUltimoContato: iso(-2), dataEntrada: iso(-6), historico: [{ id: "h1", data: iso(-6), autor: "Rafael Souza", descricao: "Lead recebido via Google Ads" }, { id: "h2", data: iso(-2), autor: "Rafael Souza", descricao: "Movido para Primeiro contato", deStage: "Lead recebido", paraStage: "Primeiro contato" }] },
  { id: "l3", nome: "Eduardo Bittencourt", empresa: "Bittencourt Advocacia", telefone: "(31) 98877-2211", email: "eduardo@bittencourtadv.com.br", cidade: "Belo Horizonte", estado: "MG", segmento: "Prestador de serviço", profissao: "Advogado", regimeTributarioAtual: "Lucro Presumido", faturamentoEstimado: 65000, numeroFuncionarios: 6, servicosInteresse: ["Contabilidade mensal", "Planejamento tributário"], origem: "Indicação", stage: "Contato realizado", responsavelId: "u1", valorEstimado: 1450, proximaAcao: "Agendar reunião", dataUltimoContato: iso(-3), dataEntrada: iso(-9), historico: [{ id: "h1", data: iso(-9), autor: "Kauane Gomes", descricao: "Indicação de cliente Ativo (Studio Movimento)" }] },
  { id: "l4", nome: "Patrícia Nogueira", empresa: "Nogueira Consultoria RH", telefone: "(11) 97733-9021", email: "patricia@nogueirarh.com.br", cidade: "Campinas", estado: "SP", segmento: "Prestador de serviço", regimeTributarioAtual: "Simples Nacional", faturamentoEstimado: 30000, servicosInteresse: ["Contabilidade mensal"], origem: "Site", stage: "Qualificação", responsavelId: "u3", valorEstimado: 750, proximaAcao: "Confirmar dados cadastrais", dataUltimoContato: iso(-1), dataEntrada: iso(-11), historico: [] },
  { id: "l5", nome: "Rodrigo Salgado", empresa: "Salgado Materiais de Construção", telefone: "(19) 99123-5567", email: "rodrigo@salgadomateriais.com.br", cidade: "Sorocaba", estado: "SP", segmento: "Comércio", regimeTributarioAtual: "Lucro Presumido", faturamentoEstimado: 180000, numeroFuncionarios: 14, servicosInteresse: ["Contabilidade mensal", "Departamento pessoal"], origem: "Prospecção ativa", stage: "Reunião agendada", responsavelId: "u1", valorEstimado: 2100, proximaAcao: "Reunião dia 02/09 às 10h", dataUltimoContato: iso(0), dataEntrada: iso(-15), historico: [] },
  { id: "l6", nome: "Camila Prado", empresa: "Prado Arquitetura", telefone: "(11) 98455-3390", email: "camila@pradoarquitetura.com", cidade: "São Paulo", estado: "SP", segmento: "Prestador de serviço", regimeTributarioAtual: "Simples Nacional", faturamentoEstimado: 22000, servicosInteresse: ["Contabilidade mensal", "Consultoria"], origem: "Indicação", stage: "Reunião realizada", responsavelId: "u3", valorEstimado: 680, proximaAcao: "Montar proposta", dataUltimoContato: iso(-2), dataEntrada: iso(-18), historico: [] },
  { id: "l7", nome: "Guilherme Peixoto", empresa: "Peixoto Farma Manipulação", telefone: "(41) 99321-8845", email: "guilherme@peixotofarma.com.br", cidade: "Curitiba", estado: "PR", segmento: "Comércio", regimeTributarioAtual: "Simples Nacional", faturamentoEstimado: 95000, numeroFuncionarios: 9, servicosInteresse: ["Contabilidade mensal", "Planejamento tributário"], origem: "Evento", stage: "Proposta enviada", responsavelId: "u1", valorEstimado: 1780, proximaAcao: "Follow-up da proposta", dataUltimoContato: iso(-4), dataEntrada: iso(-22), historico: [] },
  { id: "l8", nome: "Beatriz Lacerda", empresa: "Lacerda Psicologia", telefone: "(11) 98090-1122", email: "beatriz@lacerdapsi.com.br", cidade: "São Paulo", estado: "SP", segmento: "Psicólogo", regimeTributarioAtual: "MEI", faturamentoEstimado: 7000, servicosInteresse: ["Desenquadramento MEI"], origem: "Instagram", stage: "Negociação", responsavelId: "u3", valorEstimado: 320, proximaAcao: "Negociar valor da mensalidade", dataUltimoContato: iso(-1), dataEntrada: iso(-25), historico: [] },
  { id: "l9", nome: "André Kimura", empresa: "Kimura Tecnologia", telefone: "(11) 99887-4411", email: "andre@kimuratech.com.br", cidade: "São Paulo", estado: "SP", segmento: "Prestador de serviço", regimeTributarioAtual: "Simples Nacional", faturamentoEstimado: 55000, numeroFuncionarios: 5, servicosInteresse: ["Contabilidade mensal", "Certificado digital"], origem: "Google", stage: "Aguardando retorno", responsavelId: "u1", valorEstimado: 1290, proximaAcao: "Aguardando aprovação do sócio", dataUltimoContato: iso(-5), dataEntrada: iso(-28), historico: [] },
  { id: "l10", nome: "Larissa Monteiro", empresa: "Monteiro Nutrição Clínica", telefone: "(11) 98233-7765", email: "larissa@monteironutri.com.br", cidade: "São Paulo", estado: "SP", segmento: "Nutricionista", regimeTributarioAtual: "Simples Nacional", faturamentoEstimado: 18000, servicosInteresse: ["Contabilidade mensal"], origem: "Indicação", stage: "Fechado", responsavelId: "u3", valorEstimado: 590, proximaAcao: "Iniciar onboarding", dataUltimoContato: iso(-2), dataEntrada: iso(-32), historico: [] },
  { id: "l11", nome: "Hugo Bezerra", empresa: "Bezerra Transportes", telefone: "(85) 99112-3344", email: "hugo@bezerratransportes.com.br", cidade: "Fortaleza", estado: "CE", segmento: "Prestador de serviço", regimeTributarioAtual: "Lucro Presumido", faturamentoEstimado: 120000, numeroFuncionarios: 20, servicosInteresse: ["Contabilidade mensal"], origem: "Parceiro", stage: "Perdido", responsavelId: "u1", valorEstimado: 1900, proximaAcao: "—", dataUltimoContato: iso(-14), dataEntrada: iso(-40), historico: [{ id: "h1", data: iso(-14), autor: "Kauane Gomes", descricao: "Cliente optou por escritório local", deStage: "Negociação", paraStage: "Perdido" }] },
  { id: "l12", nome: "Tatiane Farias", empresa: "Farias Moda Íntima", telefone: "(11) 98744-2200", email: "tatiane@fariasmoda.com.br", cidade: "Guarulhos", estado: "SP", segmento: "Comércio", regimeTributarioAtual: "Simples Nacional", faturamentoEstimado: 33000, servicosInteresse: ["Contabilidade mensal", "Regularização"], origem: "WhatsApp", stage: "Qualificação", responsavelId: "u3", valorEstimado: 620, proximaAcao: "Solicitar CNPJ e faturamento", dataUltimoContato: iso(0), dataEntrada: iso(-3), historico: [] },
  { id: "l13", nome: "Vitor Hugo Amaral", empresa: "Amaral Engenharia", telefone: "(48) 99665-1230", email: "vitor@amaralengenharia.com.br", cidade: "Florianópolis", estado: "SC", segmento: "Prestador de serviço", regimeTributarioAtual: "Lucro Presumido", faturamentoEstimado: 210000, numeroFuncionarios: 18, servicosInteresse: ["Contabilidade mensal", "Planejamento tributário", "Consultoria"], origem: "Prospecção ativa", stage: "Primeiro contato", responsavelId: "u1", valorEstimado: 2600, proximaAcao: "Enviar apresentação institucional", dataUltimoContato: iso(-1), dataEntrada: iso(-4), historico: [] },
  { id: "l14", nome: "Renata Cordeiro", empresa: "Cordeiro Pet Shop", telefone: "(11) 98600-7712", email: "renata@cordeiropet.com.br", cidade: "São Paulo", estado: "SP", segmento: "Comércio", regimeTributarioAtual: "Simples Nacional", faturamentoEstimado: 26000, servicosInteresse: ["Abertura de empresa"], origem: "Site", stage: "Lead recebido", responsavelId: "u3", valorEstimado: 540, proximaAcao: "Primeiro contato", dataUltimoContato: iso(0), dataEntrada: iso(0), historico: [] },
];

// ---------------- Clientes ----------------

const clientBase = (
  overrides: Partial<Omit<Client, "dados">> & {
    id: string;
    razaoSocial: string;
    cnpj: string;
    dados?: Partial<Client["dados"]>;
  }
): Client => ({
  id: overrides.id,
  status: overrides.status ?? "Ativo",
  dados: {
    razaoSocial: overrides.razaoSocial,
    nomeFantasia: overrides.dados?.nomeFantasia,
    cnpj: overrides.cnpj,
    inscricaoEstadual: overrides.dados?.inscricaoEstadual ?? "Isenta",
    inscricaoMunicipal: overrides.dados?.inscricaoMunicipal ?? "—",
    cnaePrincipal: overrides.dados?.cnaePrincipal ?? "8630-5/03",
    cnaesSecundarios: overrides.dados?.cnaesSecundarios ?? [],
    naturezaJuridica: overrides.dados?.naturezaJuridica ?? "Sociedade Empresária Limitada",
    dataAbertura: overrides.dados?.dataAbertura ?? "2019-04-10",
    capitalSocial: overrides.dados?.capitalSocial ?? 20000,
    regimeTributario: overrides.dados?.regimeTributario ?? "Simples Nacional",
    municipio: overrides.dados?.municipio ?? "São Paulo",
    estado: overrides.dados?.estado ?? "SP",
    endereco: overrides.dados?.endereco ?? "—",
  },
  socios: overrides.socios ?? [],
  contatos: overrides.contatos ?? [],
  responsaveis: overrides.responsaveis ?? { fiscal: "u4", contabil: "u5", pessoal: "u6", relacionamento: "u9", financeiro: "u8" },
  segmento: overrides.segmento ?? "Prestador de serviço",
  tags: overrides.tags ?? [],
  financeiro: overrides.financeiro ?? {
    valorMensal: 890,
    vencimentoDia: 10,
    formaPagamento: "Boleto",
    inicioContrato: "2022-01-10",
    statusFinanceiro: "Pago",
  },
  historicoFinanceiro: overrides.historicoFinanceiro ?? [],
  onboarding: overrides.onboarding ?? [],
  notasDepartamentos: overrides.notasDepartamentos,
  numeroFuncionarios: overrides.numeroFuncionarios,
  leadOrigemId: overrides.leadOrigemId,
  criadoEm: overrides.criadoEm ?? "2022-01-10",
});

const ONBOARDING_TEMPLATE = [
  "Contrato enviado",
  "Contrato assinado",
  "Procuração solicitada",
  "Procuração recebida",
  "Certificado digital solicitado",
  "Certificado recebido",
  "Documentos societários recebidos",
  "Acesso ao gov.br recebido",
  "Acesso municipal recebido",
  "Acesso estadual recebido",
  "Dados da folha recebidos",
  "Importação de dados",
  "Cadastro nos sistemas",
  "Responsáveis definidos",
  "Financeiro configurado",
  "Grupo/canal de atendimento criado",
  "Reunião de boas-vindas realizada",
  "Onboarding concluído",
];

function onboardingFrom(concluidos: number) {
  return ONBOARDING_TEMPLATE.map((label, i) => ({
    id: `ob${i}`,
    label,
    concluido: i < concluidos,
    dataConclusao: i < concluidos ? iso(-30 + i) : undefined,
  }));
}

function historicoFin(clienteMensal: number, meses = 6, atraso = false): Client["historicoFinanceiro"] {
  const out: Client["historicoFinanceiro"] = [];
  for (let i = meses; i >= 1; i--) {
    const late = atraso && i === 1;
    out.push({
      id: `hf${i}`,
      competencia: iso(-30 * i).slice(0, 7),
      valor: clienteMensal,
      vencimento: iso(-30 * i + 10),
      pagamento: late ? undefined : iso(-30 * i + 9),
      status: late ? "Atrasado" : "Pago",
    });
  }
  return out;
}

export const CLIENTS: Client[] = [
  clientBase({
    id: "c1",
    numeroFuncionarios: 3,
    razaoSocial: "Studio Movimento Pilates e Fisioterapia Ltda",
    cnpj: "31.244.887/0001-02",
    status: "Ativo",
    segmento: "Fisioterapeuta",
    tags: ["#Saúde", "#SimplesNacional", "#ClienteVIP"],
    dados: { nomeFantasia: "Studio Movimento", cnaePrincipal: "9313-1/00", dataAbertura: "2018-03-02", capitalSocial: 15000, regimeTributario: "Simples Nacional", municipio: "São Paulo", estado: "SP", endereco: "Rua Harmonia, 214 — Sumaré, São Paulo/SP" },
    socios: [{ id: "s1", nome: "Camila Ferraz", cpf: "321.554.887-20", percentual: 100, telefone: "(11) 98211-0099", email: "camila@studiomovimento.com.br", administrador: true, dataEntrada: "2018-03-02" }],
    contatos: [{ id: "ct1", nome: "Camila Ferraz", papel: "Sócio", telefone: "(11) 98211-0099", email: "camila@studiomovimento.com.br" }, { id: "ct2", nome: "Ana Paula (financeiro)", papel: "Financeiro", email: "financeiro@studiomovimento.com.br" }],
    financeiro: { valorMensal: 780, vencimentoDia: 10, formaPagamento: "Boleto", inicioContrato: "2018-03-15", statusFinanceiro: "Pago" },
    historicoFinanceiro: historicoFin(780),
    onboarding: onboardingFrom(18),
    responsaveis: { comercial: "u1", relacionamento: "u9", fiscal: "u4", contabil: "u5", pessoal: "u6", societario: "u7", financeiro: "u8" },
    notasDepartamentos: {
      fiscal: { nota: "Movimento em dia, sem pendências. Próxima apuração do Simples em 20/09.", atualizadoEm: iso(-3) },
      contabil: { nota: "Balancete de agosto fechado e enviado ao cliente.", atualizadoEm: iso(-5) },
      pessoal: { nota: "Folha de julho processada. Aguardando exame periódico de 1 colaboradora.", atualizadoEm: iso(-2) },
    },
    criadoEm: "2018-03-02",
  }),
  clientBase({
    id: "c2",
    numeroFuncionarios: 5,
    razaoSocial: "Dr. Felipe Andrade Consultório Odontológico Ltda",
    cnpj: "29.887.410/0001-45",
    status: "Ativo",
    segmento: "Clínica odontológica",
    tags: ["#Saúde", "#Odontologia", "#LucroPresumido"],
    dados: { nomeFantasia: "Andrade Odonto", cnaePrincipal: "8630-5/04", regimeTributario: "Lucro Presumido", capitalSocial: 30000, municipio: "São Paulo", estado: "SP", endereco: "Av. Paulista, 1100 — Bela Vista, São Paulo/SP" },
    socios: [{ id: "s1", nome: "Felipe Andrade", cpf: "220.998.774-11", percentual: 100, administrador: true, dataEntrada: "2017-06-01" }],
    financeiro: { valorMensal: 1250, vencimentoDia: 5, formaPagamento: "PIX", inicioContrato: "2017-06-10", statusFinanceiro: "Pago" },
    historicoFinanceiro: historicoFin(1250),
    onboarding: onboardingFrom(18),
    criadoEm: "2017-06-01",
  }),
  clientBase({
    id: "c3",
    numeroFuncionarios: 0,
    razaoSocial: "Nogueira & Prado Contabilidade Digital Ltda", // placeholder distinct
    cnpj: "35.221.774/0001-19",
    status: "Com pendência",
    segmento: "MEI",
    tags: ["#MEI", "#PendênciaFiscal"],
    dados: { nomeFantasia: "Prado Design", regimeTributario: "MEI", cnaePrincipal: "7410-2/02", capitalSocial: 1000, municipio: "Campinas", estado: "SP" },
    financeiro: { valorMensal: 250, vencimentoDia: 15, formaPagamento: "Boleto", inicioContrato: "2023-02-01", statusFinanceiro: "Em aberto" },
    historicoFinanceiro: historicoFin(250, 6, true),
    onboarding: onboardingFrom(18),
    criadoEm: "2023-02-01",
  }),
  clientBase({
    id: "c4",
    numeroFuncionarios: 14,
    razaoSocial: "Salgado Materiais de Construção Ltda",
    cnpj: "40.112.998/0001-77",
    status: "Onboarding",
    segmento: "Comércio",
    tags: ["#Comércio", "#Funcionários"],
    dados: { nomeFantasia: "Salgado Materiais", regimeTributario: "Lucro Presumido", cnaePrincipal: "4744-0/99", capitalSocial: 80000, municipio: "Sorocaba", estado: "SP" },
    financeiro: { valorMensal: 2100, vencimentoDia: 10, formaPagamento: "Boleto", inicioContrato: iso(-10), statusFinanceiro: "Em aberto" },
    historicoFinanceiro: [],
    onboarding: onboardingFrom(6),
    leadOrigemId: "l5",
    criadoEm: iso(-10),
  }),
  clientBase({
    id: "c5",
    numeroFuncionarios: 1,
    razaoSocial: "Monteiro Nutrição Clínica Ltda",
    cnpj: "41.556.223/0001-30",
    status: "Onboarding",
    segmento: "Nutricionista",
    tags: ["#Saúde"],
    dados: { nomeFantasia: "Monteiro Nutrição", regimeTributario: "Simples Nacional", cnaePrincipal: "8650-0/03", capitalSocial: 5000, municipio: "São Paulo", estado: "SP" },
    financeiro: { valorMensal: 590, vencimentoDia: 20, formaPagamento: "PIX", inicioContrato: iso(-2), statusFinanceiro: "Em aberto" },
    onboarding: onboardingFrom(3),
    leadOrigemId: "l10",
    criadoEm: iso(-2),
  }),
  clientBase({
    id: "c6",
    numeroFuncionarios: 6,
    razaoSocial: "Bittencourt Advocacia Associados",
    cnpj: "22.887.665/0001-40",
    status: "Ativo",
    segmento: "Prestador de serviço",
    tags: ["#ClienteVIP", "#LucroPresumido"],
    dados: { nomeFantasia: "Bittencourt Advocacia", regimeTributario: "Lucro Presumido", cnaePrincipal: "6911-7/01", capitalSocial: 50000, municipio: "Belo Horizonte", estado: "MG" },
    financeiro: { valorMensal: 1450, vencimentoDia: 8, formaPagamento: "Boleto", inicioContrato: "2021-05-10", statusFinanceiro: "Pago" },
    historicoFinanceiro: historicoFin(1450),
    onboarding: onboardingFrom(18),
    criadoEm: "2021-05-10",
  }),
  clientBase({
    id: "c7",
    numeroFuncionarios: 5,
    razaoSocial: "Kimura Tecnologia e Sistemas Ltda",
    cnpj: "38.221.100/0001-88",
    status: "Suspenso",
    segmento: "Prestador de serviço",
    tags: ["#Tecnologia"],
    dados: { nomeFantasia: "Kimura Tech", regimeTributario: "Simples Nacional", cnaePrincipal: "6201-5/01", capitalSocial: 10000, municipio: "São Paulo", estado: "SP" },
    financeiro: { valorMensal: 1290, vencimentoDia: 10, formaPagamento: "Boleto", inicioContrato: "2020-08-01", statusFinanceiro: "Atrasado" },
    historicoFinanceiro: historicoFin(1290, 6, true),
    onboarding: onboardingFrom(18),
    criadoEm: "2020-08-01",
  }),
  clientBase({
    id: "c8",
    numeroFuncionarios: 0,
    razaoSocial: "Lacerda Psicologia Clínica",
    cnpj: "44.887.221/0001-05",
    status: "Em processo de cancelamento",
    segmento: "Psicólogo",
    tags: ["#Saúde", "#MEI"],
    dados: { nomeFantasia: "Lacerda Psi", regimeTributario: "MEI", cnaePrincipal: "8650-0/06", capitalSocial: 1000, municipio: "São Paulo", estado: "SP" },
    financeiro: { valorMensal: 320, vencimentoDia: 5, formaPagamento: "PIX", inicioContrato: "2023-09-01", statusFinanceiro: "Cancelado" },
    onboarding: onboardingFrom(18),
    criadoEm: "2023-09-01",
  }),
  clientBase({
    id: "c9",
    numeroFuncionarios: 4,
    razaoSocial: "Rocha & Vieira Comércio de Alimentos Ltda",
    cnpj: "37.221.887/0001-63",
    status: "Ativo",
    segmento: "Comércio",
    tags: ["#Comércio"],
    dados: { nomeFantasia: "Empório Rocha", regimeTributario: "Simples Nacional", cnaePrincipal: "4721-1/02", capitalSocial: 25000, municipio: "Rio de Janeiro", estado: "RJ" },
    financeiro: { valorMensal: 980, vencimentoDia: 12, formaPagamento: "Boleto", inicioContrato: "2019-11-20", statusFinanceiro: "Pago" },
    historicoFinanceiro: historicoFin(980),
    onboarding: onboardingFrom(18),
    criadoEm: "2019-11-20",
  }),
  clientBase({
    id: "c10",
    numeroFuncionarios: 9,
    razaoSocial: "Peixoto Farma Manipulação Ltda",
    cnpj: "39.887.221/0001-91",
    status: "Ativo",
    segmento: "Comércio",
    tags: ["#Saúde", "#Funcionários"],
    dados: { nomeFantasia: "Peixoto Farma", regimeTributario: "Simples Nacional", cnaePrincipal: "4771-7/03", capitalSocial: 40000, municipio: "Curitiba", estado: "PR" },
    financeiro: { valorMensal: 1780, vencimentoDia: 10, formaPagamento: "Boleto", inicioContrato: "2022-06-01", statusFinanceiro: "Pago" },
    historicoFinanceiro: historicoFin(1780),
    onboarding: onboardingFrom(18),
    criadoEm: "2022-06-01",
  }),
  clientBase({
    id: "c11",
    numeroFuncionarios: 18,
    razaoSocial: "Amaral Engenharia e Projetos Ltda",
    cnpj: "42.665.887/0001-22",
    status: "Ativo",
    segmento: "Prestador de serviço",
    tags: ["#Engenharia", "#ClienteVIP"],
    dados: { nomeFantasia: "Amaral Engenharia", regimeTributario: "Lucro Presumido", cnaePrincipal: "7112-0/00", capitalSocial: 100000, municipio: "Florianópolis", estado: "SC" },
    financeiro: { valorMensal: 2600, vencimentoDia: 10, formaPagamento: "Boleto", inicioContrato: "2021-02-15", statusFinanceiro: "Pago" },
    historicoFinanceiro: historicoFin(2600),
    onboarding: onboardingFrom(18),
    criadoEm: "2021-02-15",
  }),
  clientBase({
    id: "c12",
    numeroFuncionarios: 0,
    razaoSocial: "Costa & Filhos Transportes Encerrada Ltda",
    cnpj: "20.554.887/0001-10",
    status: "Encerrado",
    segmento: "Prestador de serviço",
    tags: [],
    dados: { nomeFantasia: "Costa Transportes", regimeTributario: "Simples Nacional", cnaePrincipal: "4930-2/02", capitalSocial: 15000, municipio: "Santos", estado: "SP" },
    financeiro: { valorMensal: 0, vencimentoDia: 10, formaPagamento: "—", inicioContrato: "2016-01-01", statusFinanceiro: "Cancelado" },
    onboarding: onboardingFrom(18),
    criadoEm: "2016-01-01",
  }),
];

// ---------------- Licenças e vencimentos ----------------

export const LICENCAS: Licenca[] = [
  { id: "lic1", clienteId: "c1", nome: "Alvará de Funcionamento", status: "Regular", dataEmissao: "2018-04-01", dataVencimento: iso(280), observacao: "Renovação automática anual" },
  { id: "lic2", clienteId: "c1", nome: "Licença Sanitária (Vigilância Sanitária)", status: "Vencendo", dataEmissao: "2025-09-01", dataVencimento: iso(25) },
  { id: "lic3", clienteId: "c1", nome: "AVCB (Corpo de Bombeiros)", status: "Regular", dataEmissao: "2024-11-10", dataVencimento: iso(400) },
  { id: "lic4", clienteId: "c2", nome: "Alvará Sanitário CRO", status: "Regular", dataEmissao: "2023-06-01", dataVencimento: iso(150) },
  { id: "lic5", clienteId: "c2", nome: "Licença de Funcionamento Municipal", status: "Vencida", dataEmissao: "2022-01-15", dataVencimento: iso(-12), observacao: "Aguardando protocolo de renovação junto à prefeitura" },
  { id: "lic6", clienteId: "c9", nome: "Alvará de Funcionamento", status: "Em renovação", dataEmissao: "2019-11-20", dataVencimento: iso(-5) },
  { id: "lic7", clienteId: "c11", nome: "Registro no CREA", status: "Regular", dataEmissao: "2021-02-15", dataVencimento: iso(500) },
];

// ---------------- Indicações ----------------

export const INDICACOES: Indicacao[] = [
  { id: "ind1", clienteId: "c1", nomeIndicado: "Bruna Kellermann", empresa: "Kellermann Odontologia", contato: "(11) 98877-2200", status: "Convertido", data: iso(-60), observacao: "Virou cliente Ativo em maio" },
  { id: "ind2", clienteId: "c1", nomeIndicado: "Rogério Assis", empresa: "Assis Personal Training", contato: "(11) 99011-4433", status: "Em contato", data: iso(-10) },
  { id: "ind3", clienteId: "c6", nomeIndicado: "Marcela Torres", empresa: "Torres Advocacia Trabalhista", contato: "(31) 98122-9090", status: "Novo", data: iso(-2) },
  { id: "ind4", clienteId: "c9", nomeIndicado: "Empório Vieira Filho", status: "Perdido", data: iso(-45), observacao: "Optou por continuar com o contador atual" },
];

// ---------------- Tarefas ----------------

export const TASKS: Task[] = [
  { id: "t1", titulo: "Solicitar documentos do cliente", descricao: "Coletar notas fiscais e extratos do mês", clienteId: "c1", departamento: "Fiscal", responsavelId: "u4", prioridade: "Normal", prazo: iso(0), status: "Em andamento", recorrencia: "Mensal", subtarefas: [], comentarios: [] },
  { id: "t2", titulo: "Conferir movimentação fiscal", clienteId: "c9", departamento: "Fiscal", responsavelId: "u4", prioridade: "Alta", prazo: iso(1), status: "Não iniciada", recorrencia: "Mensal", subtarefas: [], comentarios: [] },
  { id: "t3", titulo: "Verificar DAS", clienteId: "c10", departamento: "Fiscal", responsavelId: "u4", prioridade: "Urgente", prazo: iso(-1), status: "Em andamento", recorrencia: "Mensal", subtarefas: [], comentarios: [] },
  { id: "t4", titulo: "Fechamento contábil competência 07/2026", clienteId: "c2", departamento: "Contábil", responsavelId: "u5", prioridade: "Alta", prazo: iso(2), status: "Em andamento", subtarefas: [{ id: "st1", titulo: "Conciliar extratos bancários", concluida: true }, { id: "st2", titulo: "Lançar folha de pagamento", concluida: false }], comentarios: [] },
  { id: "t5", titulo: "Processar admissão de funcionário", clienteId: "c4", departamento: "Pessoal", responsavelId: "u6", prioridade: "Alta", prazo: iso(0), status: "Aguardando cliente", subtarefas: [], comentarios: [{ id: "cm1", autor: "Priscila Nunes", data: iso(-1), texto: "Aguardando exame admissional do cliente" }] },
  { id: "t6", titulo: "Regularizar pendência fiscal", clienteId: "c3", departamento: "Fiscal", responsavelId: "u4", prioridade: "Urgente", prazo: iso(-2), status: "Em análise", subtarefas: [], comentarios: [] },
  { id: "t7", titulo: "Enviar proposta comercial", clienteId: undefined, departamento: "Comercial", responsavelId: "u1", prioridade: "Alta", prazo: iso(1), status: "Não iniciada", subtarefas: [], comentarios: [] },
  { id: "t8", titulo: "Follow-up lead Kimura Tecnologia", departamento: "Comercial", responsavelId: "u1", prioridade: "Normal", prazo: iso(0), status: "Não iniciada", subtarefas: [], comentarios: [] },
  { id: "t9", titulo: "Preparar checklist de onboarding", clienteId: "c5", departamento: "Relacionamento", responsavelId: "u9", prioridade: "Normal", prazo: iso(3), status: "Em andamento", subtarefas: [], comentarios: [] },
  { id: "t10", titulo: "Renovar certificado digital", clienteId: "c6", departamento: "Societário", responsavelId: "u7", prioridade: "Alta", prazo: iso(6), status: "Não iniciada", subtarefas: [], comentarios: [] },
  { id: "t11", titulo: "Conferir folha de pagamento", clienteId: "c1", departamento: "Pessoal", responsavelId: "u6", prioridade: "Normal", prazo: iso(4), status: "Não iniciada", recorrencia: "Mensal", subtarefas: [], comentarios: [] },
  { id: "t12", titulo: "Enviar balancete", clienteId: "c11", departamento: "Contábil", responsavelId: "u5", prioridade: "Normal", prazo: iso(5), status: "Não iniciada", recorrencia: "Mensal", subtarefas: [], comentarios: [] },
  { id: "t13", titulo: "Atualizar dados cadastrais na prefeitura", clienteId: "c9", departamento: "Societário", responsavelId: "u7", prioridade: "Baixa", prazo: iso(10), status: "Não iniciada", subtarefas: [], comentarios: [] },
  { id: "t14", titulo: "Cobrar honorário em atraso", clienteId: "c7", departamento: "Financeiro", responsavelId: "u8", prioridade: "Urgente", prazo: iso(-3), status: "Em andamento", subtarefas: [], comentarios: [] },
  { id: "t15", titulo: "Revisar contrato de prestação de serviço", clienteId: "c12", departamento: "Financeiro", responsavelId: "u8", prioridade: "Baixa", prazo: iso(15), status: "Cancelada", subtarefas: [], comentarios: [] },
];

// A task counts as "overdue" in the UI whenever prazo < hoje and status isn't terminal —
// computed from the fields above rather than stored as its own status.

// ---------------- Obrigações ----------------

const OBLIGATION_TYPES = ["PGDAS-D", "DAS", "DCTFWeb", "EFD-Reinf", "eSocial", "FGTS Digital", "ISS", "DEFIS"];

export const OBLIGATIONS: Obligation[] = CLIENTS.filter((c) => c.status === "Ativo" || c.status === "Com pendência").flatMap((c, ci) =>
  OBLIGATION_TYPES.slice(0, 4).map((tipo, i) => {
    const dueOffset = [-2, 0, 3, 7][i % 4] + (ci % 3);
    const statuses: Obligation["status"][] = ["Em atraso", "A fazer", "Em andamento", "Concluído"];
    return {
      id: `${c.id}-ob-${i}`,
      tipo,
      clienteId: c.id,
      competencia: iso(-15).slice(0, 7),
      responsavelId: c.responsaveis.fiscal ?? "u4",
      vencimento: iso(dueOffset),
      status: dueOffset < 0 ? "Em atraso" : statuses[(ci + i) % statuses.length],
      protocolo: dueOffset < 0 ? undefined : `PR${1000 + ci * 10 + i}`,
      observacoes: undefined,
    } satisfies Obligation;
  })
);

// ---------------- Societário ----------------

function etapasAberturaEmpresa(responsavelId: string, dataAbertura: string, statuses: ChecklistStatus[]): EtapaProcesso[] {
  return ETAPAS_ABERTURA_EMPRESA.map((descricao, i) => ({
    id: `et${i}`,
    descricao,
    responsavelId,
    inicio: dataAbertura,
    prazo: iso(-9 + i),
    status: statuses[i] ?? "Pendente",
  }));
}

export const PROCESSOS_SOCIETARIOS: ProcessoSocietario[] = [
  {
    id: "ps1", clienteId: "c4", tipoServico: "Abertura de empresa", responsavelId: "u7", orgao: "Junta Comercial SP", protocolo: "JC-2209981", dataAbertura: iso(-9), prazo: iso(2), status: "Em análise", observacoes: "Aguardando análise do órgão",
    valorProcesso: 300, pagamento: "Pago",
    etapas: etapasAberturaEmpresa("u7", iso(-9), [
      "OK", "OK", "OK", "Dispensada", "OK", // Junta Comercial
      "OK", "OK", "OK", // Receita Federal
      "Pendente", "Pendente", "Pendente", "Pendente", // Prefeitura
      "Dispensada", "Dispensada", "Dispensada", // Estado
      "Pendente", "Dispensada", "Dispensada", "Dispensada", "Pendente", "Pendente", "Pendente", "Dispensada", "OK", "Pendente", "Pendente", // Demais obrigações
    ]),
  },
  { id: "ps2", clienteId: "c5", tipoServico: "Inscrição municipal", responsavelId: "u7", orgao: "Prefeitura de São Paulo", dataAbertura: iso(-2), prazo: iso(8), status: "Documentação", etapas: [] },
  { id: "ps3", clienteId: "c9", tipoServico: "Alteração contratual", responsavelId: "u7", orgao: "Junta Comercial RJ", protocolo: "JC-1187722", dataAbertura: iso(-20), prazo: iso(-3), status: "Exigência", pendencias: "Falta assinatura de sócio", etapas: [] },
  { id: "ps4", clienteId: "c3", tipoServico: "Regularização", responsavelId: "u7", orgao: "Receita Federal", dataAbertura: iso(-30), prazo: iso(-5), status: "Solicitado", etapas: [] },
];

// ---------------- Certificados ----------------

export const CERTIFICADOS: Certificado[] = [
  { id: "cert1", clienteId: "c1", documento: "31.244.887/0001-02", tipo: "e-CNPJ A1", dataEmissao: iso(-300), dataVencimento: iso(3), status: "Renovação próxima", valor: 220, formaPagamento: "PIX", responsavelId: "u7" },
  { id: "cert2", clienteId: "c6", documento: "22.887.665/0001-40", tipo: "e-CNPJ A1", dataEmissao: iso(-355), dataVencimento: iso(10), status: "Renovação próxima", valor: 220, responsavelId: "u7" },
  { id: "cert3", clienteId: "c9", documento: "37.221.887/0001-63", tipo: "e-CNPJ A3", dataEmissao: iso(-360), dataVencimento: iso(-4), status: "Vencido", valor: 350, responsavelId: "u7" },
  { id: "cert4", clienteId: "c2", documento: "220.998.774-11", tipo: "e-CPF A1", dataEmissao: iso(-100), dataVencimento: iso(265), status: "Entregue", valor: 180, responsavelId: "u7" },
  { id: "cert5", clienteId: "c4", documento: "40.112.998/0001-77", tipo: "e-CNPJ A1", dataVencimento: iso(30), status: "Aguardando validação", valor: 220, responsavelId: "u7" },
  { id: "cert6", clienteId: "c10", documento: "39.887.221/0001-91", tipo: "e-CNPJ A1", dataEmissao: iso(-200), dataVencimento: iso(165), status: "Entregue", valor: 220, responsavelId: "u7" },
  { id: "cert7", clienteId: "c11", documento: "42.665.887/0001-22", tipo: "e-CNPJ A3", dataVencimento: iso(14), status: "Renovação próxima", valor: 350, responsavelId: "u7" },
  { id: "cert8", clienteId: "c5", documento: "41.556.223/0001-30", tipo: "e-CNPJ A1", dataVencimento: iso(60), status: "Agendamento solicitado", valor: 220, responsavelId: "u7" },
];

// ---------------- Documentos ----------------

export const DOCUMENTOS: Documento[] = [
  { id: "d1", clienteId: "c1", nome: "Contrato Social - Studio Movimento.pdf", categoria: "Documentos societários", dataArquivo: "2018-03-02", responsavelId: "u7", tamanho: "1.2 MB" },
  { id: "d2", clienteId: "c1", nome: "Guia DAS 07-2026.pdf", categoria: "Guias", dataArquivo: iso(-20), responsavelId: "u4", tamanho: "180 KB" },
  { id: "d3", clienteId: "c1", nome: "Folha de pagamento 07-2026.pdf", categoria: "Folha", dataArquivo: iso(-18), responsavelId: "u6", tamanho: "340 KB" },
  { id: "d4", clienteId: "c2", nome: "Contrato de Prestação de Serviços.pdf", categoria: "Contratos", dataArquivo: "2017-06-10", responsavelId: "u1", tamanho: "980 KB" },
  { id: "d5", clienteId: "c2", nome: "Procuração eletrônica.pdf", categoria: "Procurações", dataArquivo: "2017-06-12", responsavelId: "u7", tamanho: "210 KB" },
  { id: "d6", clienteId: "c4", nome: "Balanço de Abertura.pdf", categoria: "Contábil", dataArquivo: iso(-8), responsavelId: "u5", tamanho: "540 KB" },
  { id: "d7", clienteId: "c6", nome: "DEFIS 2025.pdf", categoria: "Fiscal", dataArquivo: iso(-60), responsavelId: "u4", tamanho: "290 KB" },
  { id: "d8", clienteId: "c9", nome: "Comprovante de pagamento 06-2026.pdf", categoria: "Comprovantes", dataArquivo: iso(-40), responsavelId: "u8", tamanho: "120 KB" },
  { id: "d9", clienteId: "c11", nome: "Relatório gerencial Q2-2026.pdf", categoria: "Relatórios", dataArquivo: iso(-50), responsavelId: "u5", tamanho: "1.6 MB" },
  { id: "d10", clienteId: "c10", nome: "Certificado Digital e-CNPJ.pfx", categoria: "Certificados", dataArquivo: iso(-200), responsavelId: "u7", tamanho: "4 KB" },
];

// ---------------- Anotações & Timeline ----------------

export const ANOTACOES: Anotacao[] = [
  { id: "an1", clienteId: "c1", autor: "Kauane Gomes", data: iso(-5), texto: "Cliente estratégico, sempre indica novos contatos.", marcador: "estrategico" },
  { id: "an2", clienteId: "c3", autor: "Marina Duarte", data: iso(-1), texto: "Cliente com pendência fiscal recorrente, atenção redobrada.", marcador: "urgente" },
  { id: "an3", clienteId: "c7", autor: "Camila Rocha", data: iso(-2), texto: "Inadimplente há 2 meses, negociar ou suspender serviços.", marcador: "atencao" },
  { id: "an4", clienteId: "c11", autor: "Kauane Gomes", data: iso(-10), texto: "Possível oportunidade de consultoria tributária adicional.", marcador: "oportunidade" },
];

export const TIMELINE: TimelineEvent[] = [
  { id: "tl1", clienteId: "c1", data: iso(-1), autor: "Kauane Gomes", tipo: "ligacao", descricao: "Kauane realizou contato com o cliente." },
  { id: "tl2", clienteId: "c1", data: iso(-1), autor: "Camila Ferraz", tipo: "documento", descricao: "Cliente enviou documentos." },
  { id: "tl3", clienteId: "c1", data: iso(-1), autor: "Isabel Ramos (Bel)", tipo: "tarefa", descricao: "Bel concluiu a tarefa “Regularizar pendência fiscal”." },
  { id: "tl4", clienteId: "c3", data: iso(-2), autor: "Marina Duarte", tipo: "email", descricao: "E-mail enviado solicitando extratos bancários." },
  { id: "tl5", clienteId: "c4", data: iso(-9), autor: "Rafael Souza", tipo: "crm", descricao: "Lead movido para Fechado — onboarding iniciado automaticamente." },
  { id: "tl6", clienteId: "c7", data: iso(-3), autor: "Camila Rocha", tipo: "mensagem", descricao: "Mensagem enviada cobrando honorário em atraso." },
];

// ---------------- Serviços extras ----------------

export const SERVICOS_EXTRAS: ServicoExtra[] = [
  { id: "se1", servico: "Alteração contratual", clienteId: "c9", valor: 450, responsavelId: "u7", data: iso(-20), pagamento: iso(-18), status: "Pago" },
  { id: "se2", servico: "Certificado digital e-CNPJ A1", clienteId: "c1", valor: 220, responsavelId: "u7", data: iso(-10), pagamento: iso(-8), status: "Pago" },
  { id: "se3", servico: "Parcelamento de débitos", clienteId: "c3", valor: 600, responsavelId: "u4", data: iso(-5), status: "Em aberto" },
  { id: "se4", servico: "Consultoria tributária pontual", clienteId: "c11", valor: 1200, responsavelId: "u1", data: iso(-3), status: "Em aberto" },
  { id: "se5", servico: "Regularização cadastral", clienteId: "c7", valor: 380, responsavelId: "u7", data: iso(-40), status: "Atrasado" },
];

// ---------------- Notificações ----------------

export const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", tipo: "urgente", titulo: "Obrigação vencendo hoje", descricao: "Rocha & Vieira Comércio possui DAS vencendo hoje.", data: iso(0), lida: false, href: "/obrigacoes" },
  { id: "n2", tipo: "certificado", titulo: "Certificado vencendo em 3 dias", descricao: "Studio Movimento — e-CNPJ A1 vence em breve.", data: iso(0), lida: false, href: "/certificados" },
  { id: "n3", tipo: "comercial", titulo: "Lead sem contato há 3 dias", descricao: "André Kimura está há 3 dias sem retorno.", data: iso(-1), lida: false, href: "/comercial" },
  { id: "n4", tipo: "financeiro", titulo: "Honorário em atraso", descricao: "Kimura Tecnologia está com pagamento atrasado.", data: iso(-1), lida: true, href: "/financeiro" },
  { id: "n5", tipo: "tarefa", titulo: "Tarefa vencida", descricao: "Verificar DAS — Peixoto Farma está atrasada.", data: iso(-1), lida: false, href: "/tarefas" },
  { id: "n6", tipo: "certificado", titulo: "Certificado vencido", descricao: "Empório Rocha — e-CNPJ A3 está vencido.", data: iso(-4), lida: true, href: "/certificados" },
];
