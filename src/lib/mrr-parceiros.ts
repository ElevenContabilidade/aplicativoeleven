import type { Client, RecebimentoParceiroMensal, ExtraParceiro, PagamentoExtraParceiroMensal } from "@/lib/types";

/** Quanto os clientes de parceiro (pagam via PIX, controlados em Parceiros)
 * somam num conjunto de competências (YYYY-MM) — usa o valor ajustado por
 * competência quando existe (senão cai no valorMensal do cadastro) e soma
 * os valores extras recorrentes do parceiro (mesma regra dos sistemas do
 * escritório: valorMensal fixo, só o mês pode ser marcado como removido),
 * exatamente como a tela de Parceiros calcula, pra manter os dois números
 * consistentes. */
export function valorParceirosNoPeriodo(
  clients: Client[],
  recebimentosParceiro: RecebimentoParceiroMensal[],
  extrasParceiro: ExtraParceiro[],
  pagamentosExtrasParceiro: PagamentoExtraParceiroMensal[],
  competencias: string[]
): number {
  const entryMap = new Map(recebimentosParceiro.map((r) => [`${r.clienteId}__${r.competencia}`, r]));
  let total = 0;

  for (const cliente of clients) {
    if (!cliente.dados.clienteParceiro) continue;
    const inicio = cliente.financeiro.inicioContrato?.slice(0, 7);
    for (const comp of competencias) {
      if (inicio && comp < inicio) continue;
      const entry = entryMap.get(`${cliente.id}__${comp}`);
      if (entry?.removido) continue;
      total += entry?.valor ?? cliente.financeiro.valorMensal;
    }
  }

  const pagamentoMap = new Map(pagamentosExtrasParceiro.map((p) => [`${p.extraParceiroId}__${p.competencia}`, p]));
  for (const extra of extrasParceiro) {
    for (const comp of competencias) {
      if (extra.inicioCompetencia && comp < extra.inicioCompetencia) continue;
      const pagamento = pagamentoMap.get(`${extra.id}__${comp}`);
      if (pagamento?.removido) continue;
      total += extra.valorMensal;
    }
  }

  return total;
}
