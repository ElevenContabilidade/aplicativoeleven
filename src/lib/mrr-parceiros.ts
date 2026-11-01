import type { BoletoMensal, Client, ClientStatus, RecebimentoParceiroMensal, ExtraParceiro, PagamentoExtraParceiroMensal } from "@/lib/types";
import { valorMensalidadeNaCompetencia } from "@/lib/boleto";

const STATUS_FORA_DO_MRR: ClientStatus[] = ["Suspenso", "Em processo de cancelamento", "Encerrado"];

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
      if (extra.fimCompetencia && comp > extra.fimCompetencia) continue;
      const pagamento = pagamentoMap.get(`${extra.id}__${comp}`);
      if (pagamento?.removido) continue;
      total += extra.valorMensal;
    }
  }

  return total;
}

export interface MrrDoPeriodo {
  /** Clientes diretos (não-parceiro) que entram no MRR, com o valor já
   * resolvido pela regra do boleto da competência (ver valorMensalidadeNaCompetencia). */
  clientesDiretos: { cliente: Client; valor: number }[];
  /** Clientes de parceiro ativos na competência (mesmo filtro da tela de Parceiros). */
  clientesParceiro: Client[];
  mrrDiretos: number;
  mrrParceiros: number;
  mrr: number;
  totalClientes: number;
}

/** MRR total numa única competência — soma o lado direto (clientes com
 * boleto/cadastro próprio) com o lado parceiro (clientes de parceiro +
 * valores extras), a mesma regra usada na tela Financeiro. Centralizado
 * aqui pra Dashboard e Financeiro nunca mostrarem números diferentes pro
 * mesmo mês (já aconteceu de ficarem dessincronizados quando essa conta
 * vivia duplicada em cada tela). */
export function mrrDoPeriodo(
  clients: Client[],
  boletosMensais: BoletoMensal[],
  recebimentosParceiro: RecebimentoParceiroMensal[],
  extrasParceiro: ExtraParceiro[],
  pagamentosExtrasParceiro: PagamentoExtraParceiroMensal[],
  competencia: string
): MrrDoPeriodo {
  const clientesAssessoriaMensal = clients.filter((c) => {
    if (c.dados.clienteParceiro || !(c.financeiro.valorMensal > 0) || STATUS_FORA_DO_MRR.includes(c.status)) return false;
    const inicio = c.financeiro.inicioContrato?.slice(0, 7);
    if (inicio && inicio > competencia) return false;
    return true;
  });
  const clientesDiretos = clientesAssessoriaMensal
    .map((c) => ({ cliente: c, valor: valorMensalidadeNaCompetencia(c.id, c.financeiro.valorMensal, boletosMensais, competencia) }))
    .filter((x): x is { cliente: Client; valor: number } => x.valor !== null);
  const mrrDiretos = clientesDiretos.reduce((a, x) => a + x.valor, 0);

  const mrrParceiros = valorParceirosNoPeriodo(clients, recebimentosParceiro, extrasParceiro, pagamentosExtrasParceiro, [competencia]);

  const clientesParceiro = clients.filter((c) => {
    if (!c.dados.clienteParceiro) return false;
    const inicio = c.financeiro.inicioContrato?.slice(0, 7);
    if (inicio && inicio > competencia) return false;
    const entry = recebimentosParceiro.find((r) => r.clienteId === c.id && r.competencia === competencia);
    return !entry?.removido;
  });

  return {
    clientesDiretos,
    clientesParceiro,
    mrrDiretos,
    mrrParceiros,
    mrr: mrrDiretos + mrrParceiros,
    totalClientes: clientesDiretos.length + clientesParceiro.length,
  };
}
