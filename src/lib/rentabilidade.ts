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
 * cadastrado; custo rateia igualmente as despesas da empresa numa
 * competência (sistemas + despesas avulsas de Contas a Pagar) entre os
 * clientes ativos (honorário > 0) que de fato usam a estrutura do
 * escritório — cliente marcado como `naoUsaDespesasEscritorio` (ex: alguns
 * clientes de parceiro que não usam nenhum sistema/ferramenta da Eleven)
 * não entra no rateio nem paga fatia nenhuma, mas continua aparecendo na
 * lista com custo zero.
 */
export function calcularRentabilidade(
  clients: Client[],
  sistemas: SistemaEscritorio[],
  pagamentosSistemas: PagamentoSistemaMensal[],
  despesasAvulsas: DespesaAvulsa[],
  competencia: string
): RentabilidadeCliente[] {
  const clientesAtivos = clients.filter((c) => (c.financeiro.valorMensal ?? 0) > 0);
  const clientesComCusto = clientesAtivos.filter((c) => !c.dados.naoUsaDespesasEscritorio);

  const despesasDoMes = contasAPagarDoPeriodo(sistemas, pagamentosSistemas, despesasAvulsas, [competencia]);
  const totalDespesas = despesasDoMes.reduce((acc, d) => acc + d.valor, 0);
  const custoPorCliente = clientesComCusto.length > 0 ? totalDespesas / clientesComCusto.length : 0;

  return clientesAtivos.map((c) => {
    const receita = c.financeiro.valorMensal ?? 0;
    const custo = c.dados.naoUsaDespesasEscritorio ? 0 : custoPorCliente;
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
