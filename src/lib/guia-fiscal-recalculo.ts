/** Multa de mora por atraso no pagamento de tributo federal: 0,33% por dia
 * de atraso, limitada a 20% do valor original (regra geral da Receita
 * Federal pra DARF/GPS/DAS pagos em atraso). Não inclui juros (Selic) —
 * só a multa de mora. */
const PERCENTUAL_MULTA_POR_DIA = 0.33;
const PERCENTUAL_MULTA_MAXIMO = 20;

export interface RecalculoGuia {
  diasAtraso: number;
  percentualMulta: number;
  valorMulta: number;
  valorAtualizado: number;
}

/** Recalcula o valor de uma guia (DARF/GPS/DAS) se paga depois do
 * vencimento — `dataPagamento` default é hoje. Sem atraso, devolve o
 * valor original sem multa. */
export function recalcularGuiaFiscal(valorOriginal: number, vencimento: string, dataPagamento?: string): RecalculoGuia {
  const pagamento = dataPagamento ? new Date(`${dataPagamento}T00:00:00`) : new Date();
  pagamento.setHours(0, 0, 0, 0);
  const dataVencimento = new Date(`${vencimento}T00:00:00`);

  const diasAtraso = Math.max(0, Math.round((pagamento.getTime() - dataVencimento.getTime()) / 86_400_000));
  const percentualMulta = Math.min(diasAtraso * PERCENTUAL_MULTA_POR_DIA, PERCENTUAL_MULTA_MAXIMO);
  const valorMulta = Math.round(valorOriginal * (percentualMulta / 100) * 100) / 100;
  const valorAtualizado = Math.round((valorOriginal + valorMulta) * 100) / 100;

  return { diasAtraso, percentualMulta, valorMulta, valorAtualizado };
}
