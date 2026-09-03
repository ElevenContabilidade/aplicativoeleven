export interface OfxTransacao {
  fitId: string;
  data: string; // YYYY-MM-DD
  valor: number;
  tipo: string; // "CREDIT" | "DEBIT" | outros
  descricao: string;
}

function extrairCampo(bloco: string, tag: string): string | undefined {
  const m = bloco.match(new RegExp(`<${tag}>([^<\r\n]*)`, "i"));
  return m ? m[1].trim() : undefined;
}

function parseData(raw: string): string {
  const digitos = raw.replace(/[^\d]/g, "").slice(0, 8);
  if (digitos.length < 8) return "";
  return `${digitos.slice(0, 4)}-${digitos.slice(4, 6)}-${digitos.slice(6, 8)}`;
}

function parseValor(raw: string): number {
  const limpo = raw.trim();
  if (limpo.includes(",") && limpo.includes(".")) return parseFloat(limpo.replace(/\./g, "").replace(",", "."));
  if (limpo.includes(",")) return parseFloat(limpo.replace(",", "."));
  return parseFloat(limpo);
}

/** Extrai as transações de um extrato bancário no formato OFX (padrão
 * aceito por praticamente todo internet banking brasileiro). Faz a leitura
 * por regex em vez de um parser XML de verdade porque OFX 1.x (SGML) não
 * fecha as tags de folha — um parser XML estrito rejeitaria esses arquivos. */
export function parseOfx(conteudo: string): OfxTransacao[] {
  const blocos = conteudo.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];
  return blocos
    .map((bloco, i) => {
      const tipo = extrairCampo(bloco, "TRNTYPE") ?? "";
      const dataRaw = extrairCampo(bloco, "DTPOSTED") ?? "";
      const valorRaw = extrairCampo(bloco, "TRNAMT") ?? "";
      const fitId = extrairCampo(bloco, "FITID") ?? `sem-fitid-${i}`;
      const memo = extrairCampo(bloco, "MEMO");
      const name = extrairCampo(bloco, "NAME");
      return {
        fitId,
        data: parseData(dataRaw),
        valor: parseValor(valorRaw),
        tipo,
        descricao: (name || memo || "").trim(),
      };
    })
    .filter((t) => t.data && !Number.isNaN(t.valor));
}
