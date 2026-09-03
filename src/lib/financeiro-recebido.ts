import type { Client, Recebimento, BoletoMensal, RecebimentoParceiroMensal } from "@/lib/types";
import { resolveBoletoLedger } from "@/lib/boleto";

/** Soma tudo que entrou (status "Pago") num conjunto de competências
 * (YYYY-MM), juntando honorários lançados direto no cliente, recebimentos
 * avulsos, boletos mensais e recebimentos de parceiro — a mesma fonte usada
 * no ledger da tela Financeiro, pra manter os dois números consistentes. */
export function recebidoDoPeriodo(
  clients: Client[],
  recebimentos: Recebimento[],
  boletosMensais: BoletoMensal[],
  recebimentosParceiro: RecebimentoParceiroMensal[],
  competencias: string[]
): number {
  let total = 0;

  for (const c of clients) {
    for (const h of c.historicoFinanceiro) {
      if (h.status === "Pago" && competencias.includes(h.competencia)) total += h.valor;
    }
  }

  for (const r of recebimentos) {
    if (r.status === "Pago" && competencias.includes(r.competencia)) total += r.valor;
  }

  for (const c of clients) {
    const emitidos = boletosMensais.filter((b) => b.clienteId === c.id && b.status === "Emitido" && !b.removido);
    for (const b of emitidos) {
      if (!competencias.includes(b.competencia)) continue;
      const { valor, status } = resolveBoletoLedger(b, c);
      if (status === "Pago") total += valor;
    }
  }

  for (const c of clients) {
    const entradas = recebimentosParceiro.filter((r) => r.clienteId === c.id && !r.removido);
    for (const r of entradas) {
      if (r.status === "Pago" && competencias.includes(r.competencia)) total += r.valor ?? c.financeiro.valorMensal;
    }
  }

  return total;
}
