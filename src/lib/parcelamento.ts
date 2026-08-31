import type { Parcelamento } from "@/lib/types";

/** Um parcelamento existe (e precisa ser enviado) em uma competência por mês,
 * começando na data de início e se repetindo pela quantidade de parcelas (em X). */
export function competenciasDoPlano(p: Parcelamento): string[] {
  const [ano, mes] = p.dataInicio.slice(0, 7).split("-").map(Number);
  const total = Math.max(1, p.quantidadeParcelas ?? 1);
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(ano, mes - 1 + i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

/** Um parcelamento está ativo enquanto o mês atual ainda estiver dentro da
 * sua faixa de parcelas (da data de início até a última parcela). */
export function isParcelamentoAtivo(p: Parcelamento): boolean {
  const competencias = competenciasDoPlano(p);
  const atual = new Date().toISOString().slice(0, 7);
  return competencias[competencias.length - 1] >= atual;
}

/** Um parcelamento é "do cliente" quando o nome digitado nele bate (sem
 * diferenciar maiúsculas/espaços) com o nome fantasia ou a razão social. */
export function parcelamentoPertenceAoCliente(p: Parcelamento, nomes: (string | undefined)[]): boolean {
  const alvo = p.clienteNome.trim().toLowerCase();
  return nomes.some((n) => !!n && n.trim().toLowerCase() === alvo);
}
