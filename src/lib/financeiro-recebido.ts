import type { Client, Recebimento, BoletoMensal, RecebimentoParceiroMensal } from "@/lib/types";
import { resolveBoletoLedger } from "@/lib/boleto";
import { valorPagoResolvido } from "@/lib/pagamento-parceiro";

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
      if (!competencias.includes(r.competencia)) continue;
      total += valorPagoResolvido(r.valorPago, r.status, r.valor ?? c.financeiro.valorMensal);
    }
  }

  return total;
}

/** Mesma fonte de recebidoDoPeriodo, mas soma o que ainda está em aberto
 * (status "Em aberto") num conjunto de competências — honorários lançados
 * direto no cliente, recebimentos avulsos, boletos mensais e recebimentos
 * de parceiro. */
export function emAbertoDoPeriodo(
  clients: Client[],
  recebimentos: Recebimento[],
  boletosMensais: BoletoMensal[],
  recebimentosParceiro: RecebimentoParceiroMensal[],
  competencias: string[]
): number {
  let total = 0;

  for (const c of clients) {
    for (const h of c.historicoFinanceiro) {
      if (h.status === "Em aberto" && competencias.includes(h.competencia)) total += h.valor;
    }
  }

  for (const r of recebimentos) {
    if (r.status === "Em aberto" && competencias.includes(r.competencia)) total += r.valor;
  }

  for (const c of clients) {
    const emitidos = boletosMensais.filter((b) => b.clienteId === c.id && b.status === "Emitido" && !b.removido);
    for (const b of emitidos) {
      if (!competencias.includes(b.competencia)) continue;
      const { valor, status } = resolveBoletoLedger(b, c);
      if (status === "Em aberto") total += valor;
    }
  }

  for (const c of clients) {
    const entradas = recebimentosParceiro.filter((r) => r.clienteId === c.id && !r.removido);
    for (const r of entradas) {
      if (!competencias.includes(r.competencia)) continue;
      if (r.status === "Em aberto") total += r.valor ?? c.financeiro.valorMensal;
    }
  }

  return total;
}

/** Mesma fonte de recebidoDoPeriodo, mas soma o que está em atraso (status
 * "Atrasado") num conjunto de competências. Boleto em atraso é calculado
 * (vencimento passou sem receber, ver resolveBoletoLedger) — Recebimento de
 * parceiro não tem status "Atrasado" no modelo dele, então não entra aqui. */
export function inadimplenciaDoPeriodo(
  clients: Client[],
  recebimentos: Recebimento[],
  boletosMensais: BoletoMensal[],
  competencias: string[]
): number {
  let total = 0;

  for (const c of clients) {
    for (const h of c.historicoFinanceiro) {
      if (h.status === "Atrasado" && competencias.includes(h.competencia)) total += h.valor;
    }
  }

  for (const r of recebimentos) {
    if (r.status === "Atrasado" && competencias.includes(r.competencia)) total += r.valor;
  }

  for (const c of clients) {
    const emitidos = boletosMensais.filter((b) => b.clienteId === c.id && b.status === "Emitido" && !b.removido);
    for (const b of emitidos) {
      if (!competencias.includes(b.competencia)) continue;
      const { valor, status } = resolveBoletoLedger(b, c);
      if (status === "Atrasado") total += valor;
    }
  }

  return total;
}
