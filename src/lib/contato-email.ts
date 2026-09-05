import type { Client } from "./types";

/** Melhor e-mail pra contatar esse cliente automaticamente (lembretes de
 * documentos etc.) — prioriza o contato de Financeiro, depois qualquer
 * contato, depois o sócio administrador, depois qualquer sócio. */
export function emailPrincipalCliente(client: Client): string | null {
  const financeiro = client.contatos.find((c) => c.papel === "Financeiro" && c.email);
  if (financeiro?.email) return financeiro.email;
  const qualquerContato = client.contatos.find((c) => c.email);
  if (qualquerContato?.email) return qualquerContato.email;
  const administrador = client.socios.find((s) => s.administrador && s.email);
  if (administrador?.email) return administrador.email;
  const qualquerSocio = client.socios.find((s) => s.email);
  return qualquerSocio?.email ?? null;
}
