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

/** Na Declaração: "Período de Apuração: 01/07/2026 a 31/07/2026" (usa o
 * mês/ano da primeira data). No Extrato: "Período de Apuração (PA): 09/2026"
 * — só mês/ano direto, sem dia, então DATE_RE (DD/MM/YYYY) não bate e precisa
 * do formato curto como alternativa. */
function findCompetencia(text: string): string | undefined {
  const lower = text.toLowerCase();
  const idx = lower.indexOf("período de apuração");
  if (idx === -1) return undefined;
  const slice = text.slice(idx, idx + 120);
  const completa = slice.match(DATE_RE);
  if (completa) {
    const [, , mm, yyyy] = completa;
    return `${yyyy}-${mm}`;
  }
  const curta = slice.match(/\b(\d{2})\/(\d{4})\b/);
  if (curta) {
    const [, mm, yyyy] = curta;
    return `${yyyy}-${mm}`;
  }
  return undefined;
}

function findCnpj(text: string): string | undefined {
  const lower = text.toLowerCase();
  // "CNPJ Matriz" aparece na Declaração; "CNPJ Estabelecimento" no Extrato —
  // o rótulo "CNPJ Básico" também existe no Extrato, mas só traz 8 dígitos
  // (sem filial/DV), então nem bate com CNPJ_RE — não precisa evitá-lo.
  for (const label of ["cnpj matriz", "cnpj estabelecimento"]) {
    const idx = lower.indexOf(label);
    if (idx === -1) continue;
    const match = text.slice(idx, idx + 60).match(CNPJ_RE);
    if (match) return match[0];
  }
  return text.match(CNPJ_RE)?.[0];
}

/**
 * O Extrato do Simples Nacional (recibo do DAS gerado/pago) traz os mesmos
 * dados que a Declaração, mas em seções diferentes: a receita do mês está na
 * linha "Receita Bruta do PA (RPA) - Competência" (3 valores — Mercado
 * Interno, Externo, Total — nessa ordem) e o imposto total está na seção
 * "Informações sobre DAS Gerado", na linha "Principal / Multa / Juros /
 * Total" (o Total já soma multa e juros de atraso, se houver).
 */
function findExtratoReceita(text: string): number | undefined {
  const idx = text.toLowerCase().indexOf("receita bruta do pa");
  if (idx === -1) return undefined;
  const slice = text.slice(idx, idx + 150);
  const valores = [...slice.matchAll(new RegExp(CURRENCY_RE.source, "g"))].map((m) => parseBRLNumber(m[0]));
  if (valores.length === 0) return undefined;
  return valores.length >= 3 ? valores[2] : valores[valores.length - 1];
}

function findExtratoImposto(text: string): number | undefined {
  const idxSecao = text.toLowerCase().indexOf("informações sobre das gerado");
  if (idxSecao === -1) return undefined;
  const idxPrincipal = text.toLowerCase().indexOf("principal", idxSecao);
  if (idxPrincipal === -1) return undefined;
  const slice = text.slice(idxPrincipal, idxPrincipal + 150);
  const valores = [...slice.matchAll(new RegExp(CURRENCY_RE.source, "g"))].map((m) => parseBRLNumber(m[0]));
  if (valores.length === 0) return undefined;
  return valores[valores.length - 1];
}

/** "6.2) Informações da Arrecadação do DAS" — quando já foi pago, traz a
 * data de pagamento antes do rótulo "Não foi reconhecido pagamento..."
 * (presente só quando ainda está em aberto). */
function findExtratoObservacaoPagamento(text: string): string | undefined {
  const idx = text.toLowerCase().indexOf("informações da arrecadação do das");
  if (idx === -1) return undefined;
  const slice = text.slice(idx, idx + 200);
  if (/não foi reconhecido pagamento/i.test(slice)) return undefined;
  const data = slice.match(DATE_RE);
  return data ? `DAS pago em ${data[0]}.` : undefined;
}

export interface ExtractedPgdas {
  cnpj?: string;
  competencia?: string; // "YYYY-MM"
  faturamento?: number;
  imposto?: number;
  /** Nota pronta pra ir no campo "Observação" — hoje só traz a data de
   * pagamento do DAS, quando o Extrato confirma que já foi pago. */
  observacaoSugerida?: string;
}

/** Best-effort: lê CNPJ, competência, faturamento e imposto total a partir
 * do texto de um PGDAS-D — tanto da Declaração (Resumo da Declaração) quanto
 * do Extrato do Simples Nacional (recibo do DAS gerado/pago), que trazem os
 * mesmos dados em seções com rótulos diferentes. */
export function extractPgdasValores(rawText: string): ExtractedPgdas {
  // O gerador do PGDAS-D desenha cada palavra como um item de texto separado
  // (às vezes já com espaço embutido), então juntar os itens sempre com um
  // único espaço (extractPdfText) deixa espaçamento irregular — "Período   de
  // Apuração" com espaços duplos/triplos. Colapsa tudo antes de procurar
  // qualquer rótulo, senão a busca por substring simplesmente não bate.
  const text = rawText.replace(/\s+/g, " ");
  const daDeclaracao = findResumoValues(text);
  const faturamento = daDeclaracao.faturamento ?? findExtratoReceita(text);
  const imposto = daDeclaracao.imposto ?? findExtratoImposto(text);
  return {
    cnpj: findCnpj(text),
    competencia: findCompetencia(text),
    faturamento,
    imposto,
    observacaoSugerida: findExtratoObservacaoPagamento(text),
  };
}
