import type { Client } from "./types";

/** Melhor telefone pra contatar esse cliente automaticamente (lembretes,
 * WhatsApp etc.) — prioriza o contato de Financeiro, depois qualquer
 * contato, depois o sócio administrador, depois qualquer sócio. */
export function telefonePrincipalCliente(client: Client): string | null {
  const financeiro = client.contatos.find((c) => c.papel === "Financeiro" && c.telefone);
  if (financeiro?.telefone) return financeiro.telefone;
  const qualquerContato = client.contatos.find((c) => c.telefone);
  if (qualquerContato?.telefone) return qualquerContato.telefone;
  const administrador = client.socios.find((s) => s.administrador && s.telefone);
  if (administrador?.telefone) return administrador.telefone;
  const qualquerSocio = client.socios.find((s) => s.telefone);
  return qualquerSocio?.telefone ?? null;
}
