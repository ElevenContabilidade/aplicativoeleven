import type { SistemaEscritorio, DespesaAvulsa, PagamentoSistemaMensal, StatusContaPagar } from "@/lib/types";

/** Valor mensal de um sistema numa competência específica — usa o histórico
 * de mudanças quando existe (a entrada mais recente que já valia naquele
 * mês), senão cai no valorMensal atual do cadastro. Isso garante que editar
 * o valor hoje não altera o que já foi registrado em meses passados. */
export function valorSistemaNaCompetencia(sistema: SistemaEscritorio, competencia: string): number {
  const historico = sistema.historicoValor ?? [];
  if (historico.length === 0) return sistema.valorMensal ?? 0;
  const aplicavel = historico
    .filter((h) => h.competencia <= competencia)
    .sort((a, b) => b.competencia.localeCompare(a.competencia))[0];
  return aplicavel ? aplicavel.valorMensal : (sistema.valorMensal ?? 0);
}

export interface LinhaContaPagar {
  key: string;
  origem: "sistema" | "avulsa";
  refId: string;
  competencia: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: StatusContaPagar;
  dataPagamento?: string;
}

/** Monta a lista de contas a pagar de um conjunto de competências (YYYY-MM):
 * uma linha por sistema/mês (a partir de SistemaEscritorio.valorMensal,
 * cruzado com o status salvo em pagamentosSistemas) + as despesas avulsas
 * cujo vencimento cai no período. */
export function contasAPagarDoPeriodo(
  sistemas: SistemaEscritorio[],
  pagamentosSistemas: PagamentoSistemaMensal[],
  despesasAvulsas: DespesaAvulsa[],
  competencias: string[]
): LinhaContaPagar[] {
  const linhasSistemas: LinhaContaPagar[] = sistemas
    .filter((s) => s.valorMensal)
    .flatMap((sis) =>
      competencias.map((comp) => {
        const pagamento = pagamentosSistemas.find((p) => p.sistemaId === sis.id && p.competencia === comp);
        const dia = sis.diaVencimento ?? 10;
        const vencimento = `${comp}-${String(dia).padStart(2, "0")}`;
        return {
          key: `sistema-${sis.id}-${comp}`,
          origem: "sistema" as const,
          refId: sis.id,
          competencia: comp,
          descricao: sis.nome,
          valor: valorSistemaNaCompetencia(sis, comp),
          vencimento,
          status: pagamento?.status ?? "Em aberto",
          dataPagamento: pagamento?.dataPagamento,
        };
      })
    );

  const linhasAvulsas: LinhaContaPagar[] = despesasAvulsas
    .filter((d) => competencias.includes(d.vencimento.slice(0, 7)))
    .map((d) => ({
      key: `avulsa-${d.id}`,
      origem: "avulsa" as const,
      refId: d.id,
      competencia: d.vencimento.slice(0, 7),
      descricao: d.descricao,
      valor: d.valor,
      vencimento: d.vencimento,
      status: d.status,
      dataPagamento: d.dataPagamento,
    }));

  return [...linhasSistemas, ...linhasAvulsas].sort((a, b) => a.vencimento.localeCompare(b.vencimento));
}
