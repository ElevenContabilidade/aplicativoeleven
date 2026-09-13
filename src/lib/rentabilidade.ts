import type { Client, DespesaAvulsa, PagamentoSistemaMensal, SistemaEscritorio } from "@/lib/types";
import { contasAPagarDoPeriodo } from "@/lib/contas-pagar";

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
 * cadastrado; custo soma, pra cada sistema/despesa avulsa da competência, a
 * fatia daquele item — dividida só entre os clientes marcados como "usam
 * esse sistema/despesa" (SistemaEscritorio.clientesQueUsam /
 * DespesaAvulsa.clientesQueUsam). Sistema/despesa sem ninguém marcado ainda
 * (campo ausente) mantém o comportamento antigo: rateia entre todos os
 * clientes ativos. Cliente marcado como `naoUsaDespesasEscritorio` nunca
 * entra em nenhum rateio, mesmo que apareça na lista de algum sistema.
 */
export function calcularRentabilidade(
  clients: Client[],
  sistemas: SistemaEscritorio[],
  pagamentosSistemas: PagamentoSistemaMensal[],
  despesasAvulsas: DespesaAvulsa[],
  competencia: string
): RentabilidadeCliente[] {
  const clientesAtivos = clients.filter((c) => (c.financeiro.valorMensal ?? 0) > 0);
  const idsElegiveis = new Set(
    clientesAtivos.filter((c) => !c.dados.naoUsaDespesasEscritorio).map((c) => c.id)
  );

  const sistemaPorId = new Map(sistemas.map((s) => [s.id, s]));
  const despesaPorId = new Map(despesasAvulsas.map((d) => [d.id, d]));
  const custoPorCliente = new Map<string, number>(clientesAtivos.map((c) => [c.id, 0]));

  const despesasDoMes = contasAPagarDoPeriodo(sistemas, pagamentosSistemas, despesasAvulsas, [competencia]);
  for (const linha of despesasDoMes) {
    const origem = linha.origem === "sistema" ? sistemaPorId.get(linha.refId) : despesaPorId.get(linha.refId);
    const marcados = origem?.clientesQueUsam;
    const beneficiarios = (marcados ?? [...idsElegiveis]).filter((id) => idsElegiveis.has(id));
    if (beneficiarios.length === 0) continue;
    const fatia = linha.valor / beneficiarios.length;
    for (const id of beneficiarios) custoPorCliente.set(id, (custoPorCliente.get(id) ?? 0) + fatia);
  }

  return clientesAtivos.map((c) => {
    const receita = c.financeiro.valorMensal ?? 0;
    const custo = custoPorCliente.get(c.id) ?? 0;
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
