import type { DocumentoCategoria } from "@/lib/types";

/** As mesmas 6 subpastas por setor que a Kauane já usa manualmente dentro
 * da pasta de cada cliente no Drive (LICENÇAS, SETOR CONTÁBIL, SETOR
 * FISCAL, SETOR PESSOAL, DOCS SÓCIO, DOCS EMPRESA) — usado tanto pra
 * decidir em qual subpasta do Drive uma categoria de documento cai quanto
 * pra mostrar essas mesmas pastas dentro do Eleven Hub. */
export const PASTAS_DRIVE = ["LICENÇAS", "SETOR CONTÁBIL", "SETOR FISCAL", "SETOR PESSOAL", "DOCS SÓCIO", "DOCS EMPRESA"] as const;
export type PastaDrive = (typeof PASTAS_DRIVE)[number];

export const PASTA_POR_CATEGORIA: Record<DocumentoCategoria, PastaDrive> = {
  Licenças: "LICENÇAS",
  Contábil: "SETOR CONTÁBIL",
  "Extratos bancários": "SETOR CONTÁBIL",
  Fiscal: "SETOR FISCAL",
  "Notas fiscais": "SETOR FISCAL",
  Guias: "SETOR FISCAL",
  Boletos: "SETOR FISCAL",
  Folha: "SETOR PESSOAL",
  Certificados: "DOCS SÓCIO",
  Procurações: "DOCS SÓCIO",
  Contratos: "DOCS EMPRESA",
  "Documentos societários": "DOCS EMPRESA",
  Relatórios: "DOCS EMPRESA",
  Comprovantes: "DOCS EMPRESA",
  Outros: "DOCS EMPRESA",
};

/** Quando um arquivo é achado direto numa dessas subpastas no Drive (sem
 * ter sido enviado pelo sistema), essa é a categoria que assumimos pra
 * ele, e é também a categoria usada ao anexar um documento direto numa
 * pasta específica pelo Eleven Hub. */
export const CATEGORIA_POR_PASTA: Record<PastaDrive, DocumentoCategoria> = {
  "LICENÇAS": "Licenças",
  "SETOR CONTÁBIL": "Contábil",
  "SETOR FISCAL": "Fiscal",
  "SETOR PESSOAL": "Folha",
  "DOCS SÓCIO": "Certificados",
  "DOCS EMPRESA": "Contratos",
};
