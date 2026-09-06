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

/** Todas as posições onde `keyword` aparece em `text` (case-insensitive). */
function allIndexesOf(text: string, keyword: string): number[] {
  const lower = text.toLowerCase();
  const indexes: number[] = [];
  let from = 0;
  for (;;) {
    const idx = lower.indexOf(keyword, from);
    if (idx === -1) break;
    indexes.push(idx);
    from = idx + keyword.length;
  }
  return indexes;
}

/** Tenta cada palavra-chave (na ordem) e, para cada uma, todas as ocorrências
 * no texto — retorna o primeiro trecho após alguma ocorrência que combine com
 * `matcher`. Necessário porque em várias guias o rótulo mais óbvio ("Data de
 * Vencimento") aparece isolado num cabeçalho de tabela, longe do valor real,
 * enquanto uma ocorrência posterior do mesmo termo (ex: dentro da composição
 * do documento) vem colada no valor. */
function nearAny(text: string, keywords: string[], window: number, matcher: RegExp): RegExpMatchArray | undefined {
  for (const keyword of keywords) {
    for (const idx of allIndexesOf(text, keyword)) {
      const match = text.slice(idx, idx + window).match(matcher);
      if (match) return match;
    }
  }
  return undefined;
}

function currencyNear(text: string, keywords: string[], window = 120): number | undefined {
  const match = nearAny(text, keywords, window, CURRENCY_RE);
  return match ? parseBRLNumber(match[0]) : undefined;
}

function dateNear(text: string, keywords: string[], window = 60): string | undefined {
  const match = nearAny(text, keywords, window, DATE_RE);
  if (!match) return undefined;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

const MES_EXTENSO_RE = new RegExp(`(${MESES_PT.join("|")})\\s*/\\s*(\\d{4})`, "i");

/** Não usa `(?<!\d\/)` só decorativo: sem isso, "18/09/2026" (uma data
 * comum de vencimento) seria lido como competência "09/2026" — o mm/aaaa
 * bate como substring de qualquer dd/mm/aaaa. */
function competenciaDoTrecho(slice: string): string | undefined {
  const numerico = slice.match(/(?<!\d\/)(\d{2})\/(\d{4})(?!\d)/);
  if (numerico) return `${numerico[2]}-${numerico[1]}`;

  const porExtenso = slice.match(MES_EXTENSO_RE);
  if (porExtenso) {
    const mes = MESES_PT.indexOf(porExtenso[1].toLowerCase()) + 1;
    return `${porExtenso[2]}-${String(mes).padStart(2, "0")}`;
  }
  return undefined;
}

/** "Período de Apuração" pode vir como "agosto/2026" (nome do mês) ou
 * "08/2026" (numérico) dependendo da guia. */
function competenciaNear(text: string, keywords: string[], window = 60): string | undefined {
  for (const keyword of keywords) {
    for (const idx of allIndexesOf(text, keyword)) {
      const encontrada = competenciaDoTrecho(text.slice(idx, idx + window));
      if (encontrada) return encontrada;
    }
  }
  return undefined;
}

/** Último recurso quando a competência não aparece colada em nenhum rótulo
 * conhecido — comum em guias GPS/DARF-INSS, onde o rótulo "Período de
 * Apuração" fica isolado num cabeçalho e o valor real só aparece bem mais
 * adiante, junto da composição do documento como "PA:08/2026". */
function competenciaFallbackGlobal(text: string): string | undefined {
  const pa = text.match(/pa\s*:\s*(\d{2})\/(\d{4})/i);
  if (pa) return `${pa[2]}-${pa[1]}`;
  return competenciaDoTrecho(text);
}

const VENCIMENTO_KEYWORDS = ["pagar este documento até", "pagar até", "data de vencimento", "vencimento"];
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
    competencia: competenciaNear(text, COMPETENCIA_KEYWORDS, 150) ?? competenciaFallbackGlobal(text),
    vencimento: dateNear(text, VENCIMENTO_KEYWORDS),
    valor: currencyNear(text, VALOR_KEYWORDS),
  };
}
