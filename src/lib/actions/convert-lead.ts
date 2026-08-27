import type { Client, Lead } from "@/lib/types";

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

/**
 * Automação: Lead → Fechado gera Cliente em Onboarding com checklist padrão,
 * responsáveis herdados do comercial e financeiro configurado a partir do valor negociado.
 */
export function createClientFromLead(lead: Lead): Client {
  const today = new Date().toISOString().slice(0, 10);
  const id = `c-${lead.id}-${Date.now()}`;

  return {
    id,
    status: "Onboarding",
    dados: {
      razaoSocial: lead.empresa ?? lead.nome,
      nomeFantasia: lead.empresa,
      cnpj: lead.cnpj ?? "Pendente de emissão",
      cnaePrincipal: "—",
      cnaesSecundarios: [],
      naturezaJuridica: "—",
      dataAbertura: today,
      capitalSocial: 0,
      regimeTributario: (lead.regimeTributarioAtual as Client["dados"]["regimeTributario"]) ?? "Simples Nacional",
      municipio: lead.cidade,
      estado: lead.estado,
      endereco: "—",
    },
    socios: [],
    contatos: [{ id: `ct-${id}`, nome: lead.nome, papel: "Sócio", telefone: lead.telefone, email: lead.email }],
    responsaveis: { comercial: lead.responsavelId, relacionamento: lead.responsavelId },
    segmento: lead.segmento ?? "Outros",
    tags: [],
    financeiro: {
      valorMensal: lead.valorEstimado,
      vencimentoDia: 10,
      formaPagamento: "Boleto",
      inicioContrato: today,
      statusFinanceiro: "Em aberto",
    },
    historicoFinanceiro: [],
    onboarding: ONBOARDING_TEMPLATE.map((label, i) => ({ id: `ob-${id}-${i}`, label, concluido: false })),
    leadOrigemId: lead.id,
    criadoEm: today,
  };
}
