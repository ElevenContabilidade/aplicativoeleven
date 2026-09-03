import { addDays, addMonths, differenceInCalendarDays, parseISO, format } from "date-fns";
import type { Funcionario } from "@/lib/types";

function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export interface PeriodoAtivo {
  indice: number;
  periodoInicio: string;
  periodoFim: string;
  /** Fim do período aquisitivo + 11 meses (1 mês de margem antes do limite
   * legal de 12 meses do período concessivo), pra sobrar tempo de agendar
   * com o cliente antes de vencer de verdade. */
  prazoLimite: string;
}

/** Período aquisitivo em aberto de um funcionário — o índice é
 * `historicoFerias.length`, ou seja, cada período confirmado avança pro
 * próximo automaticamente. */
export function periodoAtivo(funcionario: Pick<Funcionario, "dataAdmissao" | "historicoFerias">): PeriodoAtivo {
  const indice = funcionario.historicoFerias.length;
  const admissao = parseISO(funcionario.dataAdmissao);
  const inicio = addMonths(admissao, indice * 12);
  const fim = addDays(addMonths(inicio, 12), -1);
  const prazoLimite = addMonths(inicio, 23);
  return { indice, periodoInicio: toISO(inicio), periodoFim: toISO(fim), prazoLimite: toISO(prazoLimite) };
}

export type StatusFerias = "Ok" | "Próximo do vencimento" | "Vencido";

export function statusFerias(prazoLimite: string, hoje: string = toISO(new Date())): StatusFerias {
  const diasRestantes = differenceInCalendarDays(parseISO(prazoLimite), parseISO(hoje));
  if (diasRestantes < 0) return "Vencido";
  if (diasRestantes <= 30) return "Próximo do vencimento";
  return "Ok";
}
