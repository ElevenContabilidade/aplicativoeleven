import type { StatusPagamentoParceiro } from "@/lib/types";

/** Quanto já entrou de verdade num lançamento de parceiro: usa o valorPago
 * salvo quando existe, senão cai no comportamento antigo (status "Pago" =
 * valor cheio, "Em aberto" = nada) — mantém registros antigos, que nunca
 * tiveram valorPago, funcionando sem migração. */
export function valorPagoResolvido(
  valorPagoSalvo: number | undefined,
  statusSalvo: StatusPagamentoParceiro | undefined,
  valor: number
): number {
  return valorPagoSalvo ?? (statusSalvo === "Pago" ? valor : 0);
}

/** Status de exibição derivado de quanto já foi pago — permite um parceiro
 * pagar só uma parte do que deve num mês sem perder o controle do que
 * ainda falta. */
export function statusRecebimentoParceiro(valorPago: number, valor: number): "Pago" | "Parcial" | "Em aberto" {
  if (valor > 0 && valorPago >= valor) return "Pago";
  if (valorPago > 0) return "Parcial";
  return "Em aberto";
}
