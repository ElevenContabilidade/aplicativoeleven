import type { ProcessoSocietario } from "@/lib/types";

export interface ServicoFinanceiro {
  tipoServico: string;
  qtd: number;
  total: number;
  recebido: number;
  aReceber: number;
}

export interface SocietarioFinanceiroResumo {
  total: number;
  recebido: number;
  aReceber: number;
  porServico: ServicoFinanceiro[];
}

/**
 * Agrega o valor cobrado (valorProcesso) dos processos societários por tipo
 * de serviço, separando o que já foi pago do que ainda está pendente.
 * Só considera processos com valorProcesso informado (> 0).
 */
export function resumoFinanceiroSocietario(processos: ProcessoSocietario[]): SocietarioFinanceiroResumo {
  const cobrados = processos.filter((p) => (p.valorProcesso ?? 0) > 0);

  const porServicoMap = new Map<string, ServicoFinanceiro>();
  for (const p of cobrados) {
    const valor = p.valorProcesso ?? 0;
    const pago = p.pagamento === "Pago";
    const entry = porServicoMap.get(p.tipoServico) ?? { tipoServico: p.tipoServico, qtd: 0, total: 0, recebido: 0, aReceber: 0 };
    entry.qtd += 1;
    entry.total += valor;
    if (pago) entry.recebido += valor;
    else entry.aReceber += valor;
    porServicoMap.set(p.tipoServico, entry);
  }

  const porServico = [...porServicoMap.values()].sort((a, b) => b.total - a.total);
  const total = porServico.reduce((a, s) => a + s.total, 0);
  const recebido = porServico.reduce((a, s) => a + s.recebido, 0);
  const aReceber = porServico.reduce((a, s) => a + s.aReceber, 0);

  return { total, recebido, aReceber, porServico };
}
