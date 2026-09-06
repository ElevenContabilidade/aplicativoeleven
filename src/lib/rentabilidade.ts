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
 * competência (sistemas + despesas avulsas de Contas a Pagar) entre todos
 * os clientes ativos (honorário > 0) — cada cliente "pesa" o mesmo na
 * estrutura, independente do que paga de honorário.
 */
export function calcularRentabilidade(
  clients: Client[],
  sistemas: SistemaEscritorio[],
  pagamentosSistemas: PagamentoSistemaMensal[],
  despesasAvulsas: DespesaAvulsa[],
  competencia: string
): RentabilidadeCliente[] {
  const clientesAtivos = clients.filter((c) => (c.financeiro.valorMensal ?? 0) > 0);

  const despesasDoMes = contasAPagarDoPeriodo(sistemas, pagamentosSistemas, despesasAvulsas, [competencia]);
  const totalDespesas = despesasDoMes.reduce((acc, d) => acc + d.valor, 0);
  const custoPorCliente = clientesAtivos.length > 0 ? totalDespesas / clientesAtivos.length : 0;

  return clientesAtivos.map((c) => {
    const receita = c.financeiro.valorMensal ?? 0;
    const margem = receita - custoPorCliente;
    return {
      clienteId: c.id,
      nome: c.dados.nomeFantasia || c.dados.razaoSocial,
      receita,
      custo: custoPorCliente,
      margem,
      margemPercentual: receita > 0 ? (margem / receita) * 100 : 0,
    };
  });
}
