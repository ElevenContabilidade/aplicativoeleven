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
