import * as XLSX from "xlsx";
import { onlyDigits, maskCnpj } from "@/lib/cnpj";
import { CLIENT_STATUS, ONBOARDING_TEMPLATE, type Client, type ClientStatus, type DadosCadastrais } from "@/lib/types";

const REGIMES: DadosCadastrais["regimeTributario"][] = ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real", "Doméstica"];

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Cada campo aceita várias formas de cabeçalho de planilha — a busca ignora
 * acento, maiúscula/minúscula e espaços/pontuação. */
const ALIASES: Record<string, string[]> = {
  cnpj: ["cnpj"],
  razaoSocial: ["razaosocial", "razao", "empresa", "cliente", "nome"],
  nomeFantasia: ["nomefantasia", "fantasia"],
  segmento: ["segmento", "nicho", "areadeatuacao"],
  regimeTributario: ["regimetributario", "regime", "enquadramento"],
  valorMensal: ["mensalidade", "valormensal", "honorario", "honorariomensal", "valor"],
  status: ["status", "situacao"],
  municipio: ["municipio", "cidade"],
  estado: ["estado", "uf"],
  inicioContrato: ["iniciodocontrato", "inicio", "datainicio", "clientedesde"],
  telefone: ["telefone", "whatsapp", "celular", "fone"],
  email: ["email", "e-mail"],
};

export interface LinhaClienteImportada {
  linha: number;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  segmento: string;
  regimeTributario: DadosCadastrais["regimeTributario"];
  valorMensal: number;
  status: ClientStatus;
  municipio: string;
  estado: string;
  inicioContrato: string;
  telefone: string;
  email: string;
  erro?: string;
}

/** Lê a planilha (CSV ou Excel) e devolve as linhas cruas, uma por cliente,
 * já casando os cabeçalhos da planilha com os campos que o app espera —
 * não importa a ordem das colunas nem o texto exato do cabeçalho. */
export async function lerPlanilhaClientes(file: File): Promise<LinhaClienteImportada[]> {
  const buffer = await file.arrayBuffer();
  // `raw: true` aqui evita que o XLSX "adivinhe" datas/números em células de
  // texto e as reformate sozinho (ex: vira "5/10/23" no padrão americano) —
  // queremos o texto exatamente como está na planilha, pra decidir o formato
  // (brasileiro ou ISO) nós mesmos logo abaixo.
  const workbook = XLSX.read(buffer, { type: "array", raw: true, cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: "" });

  if (rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const headerPorCampo: Record<string, string | undefined> = {};
  for (const [campo, aliases] of Object.entries(ALIASES)) {
    headerPorCampo[campo] = headers.find((h) => aliases.includes(normalizar(h)));
  }

  function valor(row: Record<string, unknown>, campo: string): string {
    const header = headerPorCampo[campo];
    if (!header) return "";
    return String(row[header] ?? "").trim();
  }

  function acharRegime(texto: string): DadosCadastrais["regimeTributario"] {
    const alvo = normalizar(texto);
    return REGIMES.find((r) => normalizar(r) === alvo) ?? "Simples Nacional";
  }

  function acharStatus(texto: string): ClientStatus {
    const alvo = normalizar(texto);
    return CLIENT_STATUS.find((s) => normalizar(s) === alvo) ?? "Ativo";
  }

  function paraValorNumerico(texto: string): number {
    const limpo = texto.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
    const n = Number(limpo);
    return Number.isFinite(n) ? n : 0;
  }

  return rows.map((row, i) => {
    const cnpjDigits = onlyDigits(valor(row, "cnpj"));
    const razaoSocial = valor(row, "razaoSocial");
    const linha: LinhaClienteImportada = {
      linha: i + 2, // +1 pelo cabeçalho, +1 porque planilhas começam em 1
      cnpj: cnpjDigits ? maskCnpj(cnpjDigits) : "",
      razaoSocial,
      nomeFantasia: valor(row, "nomeFantasia"),
      segmento: valor(row, "segmento") || "Outros",
      regimeTributario: acharRegime(valor(row, "regimeTributario")),
      valorMensal: paraValorNumerico(valor(row, "valorMensal")),
      status: acharStatus(valor(row, "status")),
      municipio: valor(row, "municipio"),
      estado: valor(row, "estado"),
      inicioContrato: valor(row, "inicioContrato"),
      telefone: valor(row, "telefone"),
      email: valor(row, "email"),
    };
    if (!razaoSocial) linha.erro = "Sem razão social/nome do cliente.";
    return linha;
  });
}

/** Aceita tanto "AAAA-MM-DD" quanto "DD/MM/AAAA" (formato mais comum em
 * planilha brasileira) — qualquer outra coisa cai no padrão (hoje). */
function paraDataIso(texto: string, padrao: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}`;
  return padrao;
}

/** Monta o Client completo (mesmo formato do cadastro manual) a partir de
 * uma linha já validada da planilha. */
export function clienteDeLinha(linha: LinhaClienteImportada, userId: string | undefined): Client {
  const today = new Date().toISOString().slice(0, 10);
  const id = `c-import-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const inicioContrato = paraDataIso(linha.inicioContrato, today);

  return {
    id,
    status: linha.status,
    dados: {
      razaoSocial: linha.razaoSocial,
      nomeFantasia: linha.nomeFantasia || undefined,
      cnpj: linha.cnpj || "Pendente de cadastro",
      cnaePrincipal: "—",
      cnaesSecundarios: [],
      naturezaJuridica: "—",
      dataAbertura: today,
      capitalSocial: 0,
      regimeTributario: linha.regimeTributario,
      municipio: linha.municipio || "—",
      estado: linha.estado || "—",
      endereco: "—",
    },
    socios: [],
    contatos:
      linha.telefone || linha.email
        ? [{ id: `ct-${id}`, nome: linha.razaoSocial, papel: "Outro", telefone: linha.telefone, email: linha.email }]
        : [],
    responsaveis: { comercial: userId, relacionamento: userId },
    segmento: linha.segmento,
    tags: [],
    financeiro: {
      valorMensal: linha.valorMensal,
      vencimentoDia: 10,
      formaPagamento: "Boleto",
      inicioContrato,
      statusFinanceiro: "Em aberto",
    },
    historicoFinanceiro: [],
    onboarding: ONBOARDING_TEMPLATE.map((label, i) => ({ id: `ob-${id}-${i}`, label, concluido: false })),
    criadoEm: today,
  };
}
