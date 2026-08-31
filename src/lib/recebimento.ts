import { pertenceAoCliente, type ClienteRef } from "@/lib/cliente-match";
import type { Recebimento } from "@/lib/types";

/** Um recebimento é "do cliente" pelo mesmo critério usado em Parcelamentos:
 * CNPJ/CPF primeiro, nome como alternativa. */
export function recebimentoPertenceAoCliente(r: Recebimento, cliente: ClienteRef): boolean {
  return pertenceAoCliente(r.nome, r.cnpjCpf, cliente);
}
