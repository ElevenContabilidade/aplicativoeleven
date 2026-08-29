/** Finds a Brazilian-format date (dd/mm/yyyy or dd-mm-yyyy) and returns it as ISO yyyy-mm-dd. */
const DATE_RE = /(\d{2})[/-](\d{2})[/-](\d{4})/;

function toIso(match: RegExpMatchArray): string {
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

export interface ExtractedLicenseDates {
  dataEmissao?: string;
  dataVencimento?: string;
}

/** Best-effort extraction of emissão/vencimento dates from a document's raw text. */
export function extractLicenseDates(text: string): ExtractedLicenseDates {
  const dataVencimento = findDateNear(text, VENCIMENTO_KEYWORDS);
  const dataEmissao = findDateNear(text, EMISSAO_KEYWORDS);
  return { dataEmissao, dataVencimento };
}
