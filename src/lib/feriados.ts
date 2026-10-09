/** Cálculo de dia útil para antecipar/prorrogar vencimentos fiscais —
 * considera só feriados nacionais oficiais (não "pontos facultativos" como
 * Carnaval e Corpus Christi, que a Receita Federal não usa pra prorrogar
 * prazo). */

function paschaEaster(ano: number): Date {
  // Algoritmo de Meeus/Jones/Butcher pro domingo de Páscoa (calendário gregoriano).
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function addDays(d: Date, dias: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + dias);
  return r;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Feriados nacionais fixos + Sexta-feira Santa (móvel, baseada na Páscoa). */
function feriadosNacionaisDoAno(ano: number): Set<string> {
  const pascoa = paschaEaster(ano);
  const sextaSanta = addDays(pascoa, -2);
  return new Set([
    `${ano}-01-01`, // Confraternização Universal
    toIso(sextaSanta), // Sexta-feira Santa
    `${ano}-04-21`, // Tiradentes
    `${ano}-05-01`, // Dia do Trabalho
    `${ano}-09-07`, // Independência
    `${ano}-10-12`, // Nossa Senhora Aparecida
    `${ano}-11-02`, // Finados
    `${ano}-11-15`, // Proclamação da República
    `${ano}-11-20`, // Consciência Negra (feriado nacional a partir de 2024)
    `${ano}-12-25`, // Natal
  ]);
}

export function isFeriadoNacional(d: Date): boolean {
  return feriadosNacionaisDoAno(d.getFullYear()).has(toIso(d));
}

export function isDiaUtil(d: Date): boolean {
  const diaSemana = d.getDay();
  return diaSemana !== 0 && diaSemana !== 6 && !isFeriadoNacional(d);
}

/** Anda pra trás até cair num dia útil (usado quando o vencimento "antecipa"). */
export function diaUtilAnterior(d: Date): Date {
  let r = d;
  while (!isDiaUtil(r)) r = addDays(r, -1);
  return r;
}

/** Anda pra frente até cair num dia útil (usado quando o vencimento "prorroga"). */
export function diaUtilPosterior(d: Date): Date {
  let r = d;
  while (!isDiaUtil(r)) r = addDays(r, 1);
  return r;
}
