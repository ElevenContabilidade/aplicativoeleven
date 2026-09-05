/** Valor em R$ no formato brasileiro (1.234,56) — milhar com ponto, decimal com vírgula. */
const CURRENCY_RE = /-?\d{1,3}(?:\.\d{3})*,\d{2}/;
const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/;
const CNPJ_RE = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;

function parseBRLNumber(raw: string): number {
  return Number(raw.replace(/\./g, "").replace(",", "."));
}

function firstIndexOfAny(text: string, keywords: string[]): number | undefined {
  const lower = text.toLowerCase();
  let best: number | undefined;
  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword);
    if (idx !== -1 && (best === undefined || idx < best)) best = idx;
  }
  return best;
}

const RECEITA_KEYWORDS = ["receita bruta auferida"];
const DEBITO_KEYWORDS = ["valor total do débito declarado", "valor total do debito declarado"];

/**
 * O PGDAS-D sempre traz, na seção "Resumo da Declaração", uma tabela de duas
 * colunas — "Receita Bruta Auferida (regime competência)" e "Valor Total do
 * Débito Declarado (R$)" — seguida pelos dois valores, na mesma ordem das
 * colunas. Como a extração de texto do PDF não preserva quebra de linha (cada
 * página vira uma única linha comprida), localizamos os dois rótulos e
 * procuramos os dois valores em R$ mais próximos depois deles, pareando pela
 * ordem em que os rótulos apareceram — mesma técnica já usada pra datas em
 * document-date-extract.ts.
 */
function findResumoValues(text: string, window = 250): { faturamento?: number; imposto?: number } {
  const posReceita = firstIndexOfAny(text, RECEITA_KEYWORDS);
  const posDebito = firstIndexOfAny(text, DEBITO_KEYWORDS);
  if (posReceita === undefined || posDebito === undefined) return {};

  const anchor = Math.max(posReceita, posDebito);
  const slice = text.slice(anchor, anchor + window);
  const re = new RegExp(CURRENCY_RE.source, "g");
  const valores: number[] = [];
  let match: RegExpExecArray | null;
  while (valores.length < 2 && (match = re.exec(slice))) {
    valores.push(parseBRLNumber(match[0]));
  }
  if (valores.length < 2) return {};

  return posReceita < posDebito
    ? { faturamento: valores[0], imposto: valores[1] }
    : { faturamento: valores[1], imposto: valores[0] };
}

/** "Período de Apuração: 01/07/2026 a 31/07/2026" — usa o mês/ano da primeira data. */
function findCompetencia(text: string): string | undefined {
  const lower = text.toLowerCase();
  const idx = lower.indexOf("período de apuração");
  if (idx === -1) return undefined;
  const match = text.slice(idx, idx + 120).match(DATE_RE);
  if (!match) return undefined;
  const [, , mm, yyyy] = match;
  return `${yyyy}-${mm}`;
}

function findCnpj(text: string): string | undefined {
  const lower = text.toLowerCase();
  const idx = lower.indexOf("cnpj matriz");
  const slice = idx !== -1 ? text.slice(idx, idx + 60) : text;
  return slice.match(CNPJ_RE)?.[0];
}

export interface ExtractedPgdas {
  cnpj?: string;
  competencia?: string; // "YYYY-MM"
  faturamento?: number;
  imposto?: number;
}

/** Best-effort: lê CNPJ, competência, faturamento e imposto total declarado
 * a partir do texto de um PGDAS-D (Declaração do Simples Nacional). */
export function extractPgdasValores(rawText: string): ExtractedPgdas {
  // O gerador do PGDAS-D desenha cada palavra como um item de texto separado
  // (às vezes já com espaço embutido), então juntar os itens sempre com um
  // único espaço (extractPdfText) deixa espaçamento irregular — "Período   de
  // Apuração" com espaços duplos/triplos. Colapsa tudo antes de procurar
  // qualquer rótulo, senão a busca por substring simplesmente não bate.
  const text = rawText.replace(/\s+/g, " ");
  return {
    cnpj: findCnpj(text),
    competencia: findCompetencia(text),
    ...findResumoValues(text),
  };
}
