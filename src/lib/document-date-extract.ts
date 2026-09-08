/** Finds a Brazilian-format date (dd/mm/yyyy or dd-mm-yyyy) and returns it as ISO yyyy-mm-dd. */
const DATE_RE = /(\d{2})[/-](\d{2})[/-](\d{4})/;

/**
 * Repeated background watermarks (e.g. a municipal seal like "PMF PMF PMF…")
 * are often real text in the PDF's text layer, not an image — and PDF.js
 * extracts text in the document's internal paint order, not visual reading
 * order. A dense watermark can land between a label ("Data Emissão") and its
 * value in the extracted string, pushing them far enough apart that the
 * proximity search below misses them entirely. Strip any short, all-caps
 * token that repeats suspiciously often before searching for dates — this
 * targets watermark-style stamps generically, not any specific word.
 */
function stripWatermarkNoise(text: string): string {
  const counts = new Map<string, number>();
  for (const token of text.split(/\s+/)) {
    if (/^[A-ZÀ-Ú]{2,8}$/.test(token)) counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const noisy = new Set([...counts.entries()].filter(([, n]) => n >= 8).map(([w]) => w));
  if (noisy.size === 0) return text;
  return text
    .split(/\s+/)
    .filter((part) => !noisy.has(part))
    .join(" ");
}

function toIso(match: RegExpMatchArray | RegExpExecArray): string {
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function isValidDate(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00`);
  return !Number.isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2100;
}

/** Looks for the first date within `window` chars after any of `keywords` in `text`. */
function findDateNear(text: string, keywords: string[], window = 60): string | undefined {
  const lower = text.toLowerCase();
  for (const keyword of keywords) {
    let from = 0;
    let idx = lower.indexOf(keyword, from);
    while (idx !== -1) {
      const slice = text.slice(idx + keyword.length, idx + keyword.length + window);
      const match = slice.match(DATE_RE);
      if (match) {
        const iso = toIso(match);
        if (isValidDate(iso)) return iso;
      }
      from = idx + keyword.length;
      idx = lower.indexOf(keyword, from);
    }
  }
  return undefined;
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

/**
 * Handles table-formatted documents where a header row ("Data Emissão | Data
 * de Validade") is followed by a separate value row ("06/05/2026 | 05/05/2027")
 * — so the date isn't textually close to its own label, but the two dates do
 * appear in the same left-to-right order as their column labels.
 */
function findDatesByOrdinalPairing(text: string, window = 400): { dataEmissao?: string; dataVencimento?: string } {
  const posEmissao = firstIndexOfAny(text, EMISSAO_KEYWORDS);
  const posVencimento = firstIndexOfAny(text, VENCIMENTO_KEYWORDS);
  if (posEmissao === undefined || posVencimento === undefined) return {};

  const anchor = Math.max(posEmissao, posVencimento);
  const slice = text.slice(anchor, anchor + window);
  const re = new RegExp(DATE_RE.source, "g");
  const dates: string[] = [];
  let match: RegExpExecArray | null;
  while (dates.length < 2 && (match = re.exec(slice))) {
    const iso = toIso(match);
    if (isValidDate(iso) && !dates.includes(iso)) dates.push(iso);
  }
  if (dates.length < 2) return {};

  return posEmissao < posVencimento
    ? { dataEmissao: dates[0], dataVencimento: dates[1] }
    : { dataEmissao: dates[1], dataVencimento: dates[0] };
}

const EMISSAO_KEYWORDS = [
  "data de emissão",
  "data emissão",
  "data de expedição",
  "emitido em",
  "expedida em",
  "expedido em",
  "gerado em",
  "emissão",
];
const VENCIMENTO_KEYWORDS = [
  "data de validade",
  "data validade",
  "data de vencimento",
  "data vencimento",
  "válido até",
  "valido ate",
  "vence em",
  "vencimento",
  "validade",
];

export interface ExtractedDocumentDates {
  dataEmissao?: string;
  dataVencimento?: string;
}

/** Tipo de documento (o que ele é), reconhecido pelo título/termo técnico
 * mais comum em cada um — testado em ordem, o primeiro que bater vence. */
const TIPOS_DOCUMENTO: { padrao: RegExp; nome: string }[] = [
  { padrao: /certificado de conformidade/i, nome: "Certificado de Conformidade" },
  { padrao: /auto de vistoria do corpo de bombeiros|\bavcb\b/i, nome: "AVCB" },
  { padrao: /certificado de licenciamento do corpo de bombeiros|\bclcb\b/i, nome: "CLCB" },
  { padrao: /alvará de funcionamento/i, nome: "Alvará de Funcionamento" },
  { padrao: /alvará de localização/i, nome: "Alvará de Localização" },
  { padrao: /licença sanitária/i, nome: "Licença Sanitária" },
  { padrao: /licença ambiental/i, nome: "Licença Ambiental" },
  { padrao: /licença de funcionamento/i, nome: "Licença de Funcionamento" },
];

/** Órgão emissor — junta com o tipo do documento quando os dois aparecem
 * (ex: "Certificado de Conformidade" + "Corpo de Bombeiros Militar" vira
 * "Certificado de Conformidade - Bombeiros"). */
const ORGAOS_EMISSORES: { padrao: RegExp; nome: string }[] = [
  { padrao: /corpo de bombeiros/i, nome: "Bombeiros" },
  { padrao: /vigilância sanitária/i, nome: "Vigilância Sanitária" },
  { padrao: /secretaria (do |de )?meio ambiente|licenciamento ambiental/i, nome: "Meio Ambiente" },
  { padrao: /prefeitura|secretaria municipal/i, nome: "Prefeitura" },
];

/** Best-effort: reconhece o tipo do documento (e o órgão emissor, quando dá
 * pra identificar) a partir do texto do PDF, pra preencher o campo "Nome"
 * sozinho — ex: um certificado do Corpo de Bombeiros vira "Certificado de
 * Conformidade - Bombeiros" em vez do usuário digitar na mão. */
export function extractDocumentNome(rawText: string): string | undefined {
  const text = stripWatermarkNoise(rawText);
  const tipo = TIPOS_DOCUMENTO.find((t) => t.padrao.test(text));
  if (!tipo) return undefined;
  const orgao = ORGAOS_EMISSORES.find((o) => o.padrao.test(text));
  return orgao ? `${tipo.nome} - ${orgao.nome}` : tipo.nome;
}

/** Best-effort extraction of emissão/vencimento dates from a document's raw text. */
export function extractDocumentDates(rawText: string): ExtractedDocumentDates {
  const text = stripWatermarkNoise(rawText);
  const nearEmissao = findDateNear(text, EMISSAO_KEYWORDS);
  const nearVencimento = findDateNear(text, VENCIMENTO_KEYWORDS);

  // Both labels resolved to distinct dates near their own keyword — trust it.
  if (nearEmissao && nearVencimento && nearEmissao !== nearVencimento) {
    return { dataEmissao: nearEmissao, dataVencimento: nearVencimento };
  }

  // Otherwise (missing, or both collapsed onto the same date — a sign the
  // nearest-date-after-label search crossed into a table's value row), try
  // pairing by column order instead.
  const ordinal = findDatesByOrdinalPairing(text);
  return {
    dataEmissao: ordinal.dataEmissao ?? nearEmissao,
    dataVencimento: ordinal.dataVencimento ?? nearVencimento,
  };
}
