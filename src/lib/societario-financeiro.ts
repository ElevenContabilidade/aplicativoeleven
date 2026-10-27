import type { ProcessoSocietario } from "@/lib/types";

/** Quanto já entrou de um processo: valor cheio se "Pago", o valorPago
 * informado se "Parcial" (nunca mais que o valor cobrado), ou 0 se
 * "Pendente". */
export function valorRecebidoProcesso(p: ProcessoSocietario): number {
  const valor = p.valorProcesso ?? 0;
  if (p.pagamento === "Pago") return valor;
  if (p.pagamento === "Parcial") return Math.min(p.valorPago ?? 0, valor);
  return 0;
}

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
 * Só considera processos com valorProcesso informado (> 0). Quando
 * `competencias` é informado, também exige que a competência do processo
 * (data do pagamento quando já pago, ou data de abertura enquanto pendente)
 * caia dentro do período filtrado — assim o processo "muda de mês" no
 * Financeiro assim que a data do pagamento é preenchida.
 */
export function resumoFinanceiroSocietario(processos: ProcessoSocietario[], competencias?: string[]): SocietarioFinanceiroResumo {
  const cobrados = processos.filter((p) => {
    if ((p.valorProcesso ?? 0) <= 0) return false;
    if (!competencias) return true;
    const temPagamento = p.pagamento === "Pago" || p.pagamento === "Parcial";
    const competencia = (temPagamento ? p.dataPagamento : p.dataAbertura)?.slice(0, 7);
    return !!competencia && competencias.includes(competencia);
  });

  const porServicoMap = new Map<string, ServicoFinanceiro>();
  for (const p of cobrados) {
    const valor = p.valorProcesso ?? 0;
    const recebidoDoProcesso = valorRecebidoProcesso(p);
    const entry = porServicoMap.get(p.tipoServico) ?? { tipoServico: p.tipoServico, qtd: 0, total: 0, recebido: 0, aReceber: 0 };
    entry.qtd += 1;
    entry.total += valor;
    entry.recebido += recebidoDoProcesso;
    entry.aReceber += valor - recebidoDoProcesso;
    porServicoMap.set(p.tipoServico, entry);
  }

  const porServico = [...porServicoMap.values()].sort((a, b) => b.total - a.total);
  const total = porServico.reduce((a, s) => a + s.total, 0);
  const recebido = porServico.reduce((a, s) => a + s.recebido, 0);
  const aReceber = porServico.reduce((a, s) => a + s.aReceber, 0);

  return { total, recebido, aReceber, porServico };
}
