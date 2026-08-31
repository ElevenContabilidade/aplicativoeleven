import { onlyDigits } from "@/lib/cnpj";

export interface ClienteRef {
  nomeFantasia?: string;
  razaoSocial?: string;
  cnpj?: string;
}

/**
 * Compara um registro solto (nome digitado livremente + CNPJ/CPF opcional,
 * como em Parcelamentos e Financeiro) com um cliente cadastrado. Prioriza o
 * CNPJ/CPF (comparando só os dígitos, ignorando pontuação) — o identificador
 * mais confiável, já que não muda com abreviações ou maiúsculas no nome.
 * Sem CNPJ/CPF informado no registro, cai para o nome fantasia/razão social.
 */
export function pertenceAoCliente(nomeDigitado: string, cnpjCpfDigitado: string | undefined, cliente: ClienteRef): boolean {
  const doc = cnpjCpfDigitado ? onlyDigits(cnpjCpfDigitado) : "";
  if (doc && cliente.cnpj) {
    return doc === onlyDigits(cliente.cnpj);
  }
  const alvo = nomeDigitado.trim().toLowerCase();
  return [cliente.nomeFantasia, cliente.razaoSocial].some((n) => !!n && n.trim().toLowerCase() === alvo);
}
