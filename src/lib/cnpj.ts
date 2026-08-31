export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function maskCnpj(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/** Formata como CPF enquanto tiver até 11 dígitos, e vira CNPJ a partir do 12º. */
export function maskCnpjCpf(value: string) {
  return onlyDigits(value).length > 11 ? maskCnpj(value) : maskCpf(value);
}

export interface CnpjLookupResult {
  razaoSocial: string;
  nomeFantasia?: string;
  cnaePrincipal: string;
  cnaesSecundarios: string[];
  naturezaJuridica: string;
  dataAbertura: string;
  capitalSocial: number;
  regimeTributario?: "MEI" | "Simples Nacional";
  municipio: string;
  estado: string;
  endereco: string;
}

interface BrasilApiCnae {
  codigo?: number | string;
  descricao?: string;
}

interface BrasilApiCnpjResponse {
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal?: number | string;
  cnae_fiscal_descricao?: string;
  cnaes_secundarios?: BrasilApiCnae[];
  natureza_juridica?: string;
  data_inicio_atividade?: string;
  capital_social?: number;
  opcao_pelo_mei?: boolean;
  opcao_pelo_simples?: boolean;
  municipio?: string;
  uf?: string;
  descricao_tipo_de_logradouro?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
}

/**
 * Consulta os dados públicos de um CNPJ via BrasilAPI (Receita Federal) e
 * devolve os campos já mapeados para o formulário de cadastro do cliente.
 */
export async function lookupCnpj(cnpj: string): Promise<CnpjLookupResult> {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) {
    throw new Error("Digite os 14 dígitos do CNPJ para buscar.");
  }

  let res: Response;
  try {
    res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  } catch {
    throw new Error("Não foi possível conectar ao serviço de consulta de CNPJ. Verifique sua conexão e tente novamente.");
  }
  if (!res.ok) {
    throw new Error(res.status === 404 ? "CNPJ não encontrado." : "Não foi possível consultar o CNPJ agora.");
  }
  const data: BrasilApiCnpjResponse = await res.json();

  const endereco = [
    [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(" "),
    data.numero,
    data.bairro,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    razaoSocial: data.razao_social ?? "",
    nomeFantasia: data.nome_fantasia || undefined,
    cnaePrincipal: [data.cnae_fiscal, data.cnae_fiscal_descricao].filter(Boolean).join(" - "),
    cnaesSecundarios: (data.cnaes_secundarios ?? []).map((c) => [c.codigo, c.descricao].filter(Boolean).join(" - ")),
    naturezaJuridica: data.natureza_juridica ?? "",
    dataAbertura: data.data_inicio_atividade ?? "",
    capitalSocial: data.capital_social ?? 0,
    regimeTributario: data.opcao_pelo_mei ? "MEI" : data.opcao_pelo_simples ? "Simples Nacional" : undefined,
    municipio: data.municipio ?? "",
    estado: data.uf ?? "",
    endereco,
  };
}
