import type { SistemaEscritorio, DespesaAvulsa, PagamentoSistemaMensal, StatusContaPagar } from "@/lib/types";

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
          valor: sis.valorMensal ?? 0,
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
