import type { Client, RecebimentoParceiroMensal, ExtraParceiro } from "@/lib/types";

/** Quanto os clientes de parceiro (pagam via PIX, controlados em Parceiros)
 * somam num conjunto de competências (YYYY-MM) — usa o valor ajustado por
 * competência quando existe (senão cai no valorMensal do cadastro) e soma
 * os valores extras do parceiro, exatamente como a tela de Parceiros
 * calcula, pra manter os dois números consistentes. */
export function valorParceirosNoPeriodo(
  clients: Client[],
  recebimentosParceiro: RecebimentoParceiroMensal[],
  extrasParceiro: ExtraParceiro[],
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

  for (const extra of extrasParceiro) {
    if (competencias.includes(extra.competencia)) total += extra.valor;
  }

  return total;
}
