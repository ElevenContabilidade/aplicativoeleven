import { ONBOARDING_TEMPLATE, type Client, type ProcessoSocietario } from "@/lib/types";

/** Nome de quem contratou um processo societário — o cliente cadastrado
 * (clienteId) quando ele já virou cliente de verdade, senão o nome avulso
 * que foi digitado na hora de criar o processo. */
export function nomeDoProcessoSocietario(
  p: Pick<ProcessoSocietario, "clienteId" | "clienteNomeAvulso">,
  clients: { id: string; dados: { razaoSocial: string } }[]
): string {
  const client = p.clienteId ? clients.find((c) => c.id === p.clienteId) : undefined;
  return client?.dados.razaoSocial ?? p.clienteNomeAvulso ?? "cliente";
}

/**
 * Monta um cadastro de cliente rápido (status Onboarding, só com o nome) a
 * partir de um processo societário avulso — usado tanto ao criar um
 * processo já vinculado a "novo cliente" quanto pelo botão "Virou cliente"
 * que promove um processo avulso depois. Fica de fora da tela de Clientes
 * até alguém completar CNPJ e os demais dados de verdade no cadastro.
 */
export function criarClienteAvulso(nome: string, responsavelId: string | undefined, hoje: string): Client {
  const id = `c-${Date.now()}`;
  return {
    id,
    status: "Onboarding",
    dados: {
      razaoSocial: nome,
      cnpj: "",
      cnaePrincipal: "—",
      cnaesSecundarios: [],
      naturezaJuridica: "Sociedade Empresária Limitada",
      dataAbertura: hoje,
      capitalSocial: 0,
      regimeTributario: "Simples Nacional",
      municipio: "—",
      estado: "—",
      endereco: "—",
      criadoViaSocietario: true,
    },
    socios: [],
    contatos: [],
    responsaveis: { societario: responsavelId },
    segmento: "Outros",
    tags: [],
    financeiro: {
      valorMensal: 0,
      vencimentoDia: 10,
      formaPagamento: "Boleto",
      inicioContrato: hoje,
      statusFinanceiro: "Em aberto",
    },
    historicoFinanceiro: [],
    onboarding: ONBOARDING_TEMPLATE.map((label, i) => ({ id: `ob-${id}-${i}`, label, concluido: false })),
    criadoEm: hoje,
  };
}
