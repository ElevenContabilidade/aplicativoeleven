/** Valor em R$ no formato brasileiro (1.234,56). */
const CURRENCY_RE = /-?\d{1,3}(?:\.\d{3})*,\d{2}/;
const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/;
const CNPJ_RE = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/;

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

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

function currencyNear(text: string, keywords: string[], window = 120): number | undefined {
  const idx = firstIndexOfAny(text, keywords);
  if (idx === undefined) return undefined;
  const match = text.slice(idx, idx + window).match(CURRENCY_RE);
  return match ? parseBRLNumber(match[0]) : undefined;
}

function dateNear(text: string, keywords: string[], window = 60): string | undefined {
  const idx = firstIndexOfAny(text, keywords);
  if (idx === undefined) return undefined;
  const match = text.slice(idx, idx + window).match(DATE_RE);
  if (!match) return undefined;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/** "Período de Apuração" pode vir como "agosto/2026" (nome do mês) ou
 * "08/2026" (numérico) dependendo da guia. */
function competenciaNear(text: string, keywords: string[], window = 60): string | undefined {
  const idx = firstIndexOfAny(text, keywords);
  if (idx === undefined) return undefined;
  const slice = text.slice(idx, idx + window).toLowerCase();

  const numerico = slice.match(/(\d{2})\/(\d{4})/);
  if (numerico) return `${numerico[2]}-${numerico[1]}`;

  const porExtenso = slice.match(new RegExp(`(${MESES_PT.join("|")})\\s*/\\s*(\\d{4})`));
  if (porExtenso) {
    const mes = MESES_PT.indexOf(porExtenso[1]) + 1;
    return `${porExtenso[2]}-${String(mes).padStart(2, "0")}`;
  }
  return undefined;
}

const VENCIMENTO_KEYWORDS = ["data de vencimento", "vencimento", "pagar este documento até", "pagar até"];
const VALOR_KEYWORDS = ["valor total do documento", "valor total a recolher", "valor total a pagar", "total a pagar", "valor total"];
const COMPETENCIA_KEYWORDS = ["período de apuração", "competência"];

export interface ExtractedGuiaFiscal {
  cnpj?: string;
  competencia?: string; // "YYYY-MM"
  vencimento?: string; // "YYYY-MM-DD"
  valor?: number;
}

/** Best-effort: lê CNPJ, competência, vencimento e valor total de uma guia
 * de recolhimento (DARF/GPS/DAS) a partir do texto do PDF. O layout varia
 * bastante entre os três tipos de guia — funciona melhor com DARF (modelo
 * padrão da Receita Federal); GPS e DAS podem precisar de ajuste depois de
 * testar com exemplos reais. */
export function extractGuiaFiscal(rawText: string): ExtractedGuiaFiscal {
  const text = rawText.replace(/\s+/g, " ");
  const cnpjIdx = text.toLowerCase().indexOf("cnpj");
  const cnpjSlice = cnpjIdx !== -1 ? text.slice(cnpjIdx, cnpjIdx + 60) : text;

  return {
    cnpj: cnpjSlice.match(CNPJ_RE)?.[0] ?? text.match(CNPJ_RE)?.[0],
    competencia: competenciaNear(text, COMPETENCIA_KEYWORDS),
    vencimento: dateNear(text, VENCIMENTO_KEYWORDS),
    valor: currencyNear(text, VALOR_KEYWORDS),
  };
}
