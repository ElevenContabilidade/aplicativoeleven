import type { Client, Recebimento, BoletoMensal, RecebimentoParceiroMensal } from "@/lib/types";
import { resolveBoletoLedger } from "@/lib/boleto";
import type { OfxTransacao } from "@/lib/ofx-parser";

export type OrigemPendencia = "cliente" | "avulso" | "boleto" | "parceiro";

/** Um valor em aberto pra receber, vindo de qualquer uma das 4 fontes do
 * Financeiro. `refId` guarda o que cada origem precisa pra ser atualizada:
 * id do lançamento (cliente/avulso) ou a competência (boleto/parceiro, que
 * são upsert por clienteId+competencia). */
export interface PendenciaRecebimento {
  key: string;
  origem: OrigemPendencia;
  clienteId?: string;
  refId: string;
  nome: string;
  competencia: string;
  valor: number;
  vencimento: string;
}

export function pendenciasEmAberto(
  clients: Client[],
  recebimentos: Recebimento[],
  boletosMensais: BoletoMensal[],
  recebimentosParceiro: RecebimentoParceiroMensal[]
): PendenciaRecebimento[] {
  const doClientes: PendenciaRecebimento[] = clients.flatMap((c) =>
    c.historicoFinanceiro
      .filter((h) => h.status === "Em aberto" || h.status === "Atrasado")
      .map((h) => ({
        key: `cliente-${c.id}-${h.id}`,
        origem: "cliente" as const,
        clienteId: c.id,
        refId: h.id,
        nome: c.dados.nomeFantasia || c.dados.razaoSocial,
        competencia: h.competencia,
        valor: h.valor,
        vencimento: h.vencimento,
      }))
  );

  const avulsos: PendenciaRecebimento[] = recebimentos
    .filter((r) => r.status === "Em aberto" || r.status === "Atrasado")
    .map((r) => ({
      key: `avulso-${r.id}`,
      origem: "avulso" as const,
      refId: r.id,
      nome: r.nome,
      competencia: r.competencia,
      valor: r.valor,
      vencimento: r.vencimento,
    }));

  const boletos: PendenciaRecebimento[] = clients.flatMap((c) => {
    const emitidos = boletosMensais.filter((b) => b.clienteId === c.id && b.status === "Emitido" && !b.removido && !b.recebido);
    return emitidos.map((b) => {
      const { valor, vencimento } = resolveBoletoLedger(b, c);
      return {
        key: `boleto-${b.id}`,
        origem: "boleto" as const,
        clienteId: c.id,
        refId: b.competencia,
        nome: c.dados.nomeFantasia || c.dados.razaoSocial,
        competencia: b.competencia,
        valor,
        vencimento,
      };
    });
  });

  const parceiros: PendenciaRecebimento[] = clients.flatMap((c) => {
    const entradas = recebimentosParceiro.filter((r) => r.clienteId === c.id && !r.removido && r.status === "Em aberto");
    return entradas.map((r) => ({
      key: `parceiro-${r.id}`,
      origem: "parceiro" as const,
      clienteId: c.id,
      refId: r.competencia,
      nome: c.dados.nomeFantasia || c.dados.razaoSocial,
      competencia: r.competencia,
      valor: r.valor ?? c.financeiro.valorMensal,
      vencimento: "",
    }));
  });

  return [...doClientes, ...avulsos, ...boletos, ...parceiros];
}

const TOLERANCIA_VALOR = 0.01;

/** Sugere, pra cada transação de crédito do extrato, qual pendência em
 * aberto ela provavelmente quita — por valor batendo (com tolerância de
 * centavo) e, entre os candidatos, a data de vencimento mais próxima da
 * data da transação. Greedy: uma vez usada como sugestão, a pendência sai
 * do pool pras próximas transações (evita sugerir a mesma duas vezes). */
export function sugerirCorrespondencias(
  transacoes: OfxTransacao[],
  pendencias: PendenciaRecebimento[]
): Map<string, string | null> {
  const disponiveis = new Set(pendencias.map((p) => p.key));
  const porKey = new Map(pendencias.map((p) => [p.key, p]));
  const resultado = new Map<string, string | null>();

  for (const t of transacoes) {
    if (t.tipo === "DEBIT" || t.valor <= 0) {
      resultado.set(t.fitId, null);
      continue;
    }
    let melhor: PendenciaRecebimento | null = null;
    let melhorDiff = Infinity;
    for (const key of disponiveis) {
      const p = porKey.get(key);
      if (!p || Math.abs(p.valor - t.valor) > TOLERANCIA_VALOR) continue;
      const diff =
        p.vencimento && t.data ? Math.abs(new Date(p.vencimento).getTime() - new Date(t.data).getTime()) : Number.MAX_SAFE_INTEGER;
      if (diff < melhorDiff) {
        melhor = p;
        melhorDiff = diff;
      }
    }
    if (melhor) {
      disponiveis.delete(melhor.key);
      resultado.set(t.fitId, melhor.key);
    } else {
      resultado.set(t.fitId, null);
    }
  }
  return resultado;
}
