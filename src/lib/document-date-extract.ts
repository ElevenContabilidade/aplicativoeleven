/** Finds a Brazilian-format date (dd/mm/yyyy or dd-mm-yyyy) and returns it as ISO yyyy-mm-dd. */
const DATE_RE = /(\d{2})[/-](\d{2})[/-](\d{4})/;

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

const EMISSAO_KEYWORDS = ["data de emissão", "data de expedição", "emitido em", "expedida em", "expedido em", "emissão"];
const VENCIMENTO_KEYWORDS = [
  "data de validade",
  "data de vencimento",
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

/** Best-effort extraction of emissão/vencimento dates from a document's raw text. */
export function extractDocumentDates(text: string): ExtractedDocumentDates {
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
