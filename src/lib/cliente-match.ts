import { onlyDigits } from "@/lib/cnpj";

export interface ClienteRef {
  id?: string;
  nomeFantasia?: string;
  razaoSocial?: string;
  cnpj?: string;
}

/**
 * Compara um registro solto (nome digitado livremente + CNPJ/CPF opcional,
 * como em Parcelamentos e Financeiro) com um cliente cadastrado. Quando o
 * registro guarda o id do cliente (vínculo explícito, feito na hora do
 * cadastro), isso decide sozinho — é o jeito mais confiável. Sem isso,
 * prioriza o CNPJ/CPF (comparando só os dígitos, ignorando pontuação), e só
 * cai pro nome fantasia/razão social se nem isso tiver.
 */
export function pertenceAoCliente(
  nomeDigitado: string,
  cnpjCpfDigitado: string | undefined,
  cliente: ClienteRef,
  clienteIdDigitado?: string
): boolean {
  if (clienteIdDigitado && cliente.id) {
    return clienteIdDigitado === cliente.id;
  }
  const doc = cnpjCpfDigitado ? onlyDigits(cnpjCpfDigitado) : "";
  if (doc && cliente.cnpj) {
    return doc === onlyDigits(cliente.cnpj);
  }
  const alvo = nomeDigitado.trim().toLowerCase();
  return [cliente.nomeFantasia, cliente.razaoSocial].some((n) => !!n && n.trim().toLowerCase() === alvo);
}
