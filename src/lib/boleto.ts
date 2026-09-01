import type { BoletoMensal } from "./types";

/** Monta a data de vencimento do boleto de uma competência, a partir do dia
 * de vencimento cadastrado no cliente — sempre puxado ao vivo do cadastro
 * financeiro, nunca salvo por competência. Se o dia não existir naquele mês
 * (ex: dia 31 em fevereiro), usa o último dia do mês. */
export function vencimentoDaCompetencia(competencia: string, vencimentoDia: number): string {
  const [ano, mes] = competencia.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dia = Math.min(Math.max(1, vencimentoDia || 1), ultimoDia);
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export interface BoletoLedgerInfo {
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: "Pago" | "Em aberto" | "Atrasado";
  /** Recebido depois do vencimento — mostra o aviso de pagamento em atraso. */
  atraso: boolean;
}

/** Resolve valor/vencimento/status de UM boleto emitido pra exibição em
 * ledgers (Financeiro geral e Histórico de honorários do cliente 360) —
 * mesma regra usada nos dois lugares, pra não duplicar a lógica. */
export function resolveBoletoLedger(
  b: Pick<BoletoMensal, "competencia" | "status" | "valor" | "vencimento" | "recebido" | "dataRecebimento" | "valorRecebido">,
  client: { financeiro: { valorMensal: number; vencimentoDia: number } }
): BoletoLedgerInfo {
  const valor = b.recebido ? (b.valorRecebido ?? b.valor ?? client.financeiro.valorMensal) : (b.valor ?? client.financeiro.valorMensal);
  const vencimento = b.vencimento ?? vencimentoDaCompetencia(b.competencia, client.financeiro.vencimentoDia);
  const hoje = new Date().toISOString().slice(0, 10);
  const status: "Pago" | "Em aberto" | "Atrasado" = b.recebido ? "Pago" : vencimento < hoje ? "Atrasado" : "Em aberto";
  const atraso = !!(b.recebido && b.dataRecebimento && b.dataRecebimento > vencimento);
  return { valor, vencimento, pagamento: b.dataRecebimento, status, atraso };
}
