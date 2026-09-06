import type { Client, TeamMember } from "@/lib/types";

export interface RentabilidadeCliente {
  clienteId: string;
  nome: string;
  receita: number;
  custo: number;
  margem: number;
  margemPercentual: number;
}

/**
 * Estimativa de rentabilidade por cliente: receita vem do honorário mensal
 * cadastrado; custo reparte o custo mensal de cada colaborador (informado em
 * Equipe) entre todos os clientes em que ele aparece como responsável (em
 * qualquer setor) — não é apontamento de horas reais, só uma aproximação por
 * carteira/carga de clientes.
 */
export function calcularRentabilidade(clients: Client[], team: TeamMember[]): RentabilidadeCliente[] {
  const custoPorMembro = new Map(team.map((m) => [m.id, m.custoMensal ?? 0]));

  const clientesPorMembro = new Map<string, Set<string>>();
  for (const c of clients) {
    const membros = new Set(Object.values(c.responsaveis).filter((v): v is string => Boolean(v)));
    for (const memberId of membros) {
      if (!clientesPorMembro.has(memberId)) clientesPorMembro.set(memberId, new Set());
      clientesPorMembro.get(memberId)!.add(c.id);
    }
  }

  return clients.map((c) => {
    const membros = new Set(Object.values(c.responsaveis).filter((v): v is string => Boolean(v)));
    let custo = 0;
    for (const memberId of membros) {
      const custoMembro = custoPorMembro.get(memberId) ?? 0;
      const nClientes = clientesPorMembro.get(memberId)?.size ?? 1;
      custo += custoMembro / nClientes;
    }

    const receita = c.financeiro.valorMensal ?? 0;
    const margem = receita - custo;
    return {
      clienteId: c.id,
      nome: c.dados.nomeFantasia || c.dados.razaoSocial,
      receita,
      custo,
      margem,
      margemPercentual: receita > 0 ? (margem / receita) * 100 : 0,
    };
  });
}
