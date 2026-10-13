import type { Indicacao, Lead } from "@/lib/types";

/** Id determinístico da indicação gerada a partir de um lead — assim dá pra
 * achar/atualizar o mesmo registro em vez de duplicar quando o lead for
 * salvo de novo. */
export function idIndicacaoDoLead(leadId: string): string {
  return `ind-lead-${leadId}`;
}

/** Quando o lead tem origem "Indicação" e um cliente indicador selecionado,
 * garante que exista (ou atualiza) o registro correspondente na aba
 * "Indicações" desse cliente, sem duplicar a cada edição do lead e sem
 * sobrescrever o status se já tiver sido alterado manualmente por lá. Se o
 * lead deixar de ser uma indicação (ou perder o cliente indicador), remove o
 * registro que tinha sido criado automaticamente. */
export function sincronizarIndicacaoDoLead(
  lead: Lead,
  indicacoes: Indicacao[],
  actions: {
    addIndicacao: (i: Indicacao) => void;
    updateIndicacao: (id: string, patch: Partial<Indicacao>) => void;
    deleteIndicacao: (id: string) => void;
  }
): void {
  const id = idIndicacaoDoLead(lead.id);
  const existente = indicacoes.find((i) => i.id === id);

  if (lead.origem !== "Indicação" || !lead.clienteIndicadorId) {
    if (existente) actions.deleteIndicacao(id);
    return;
  }

  const dados = {
    clienteId: lead.clienteIndicadorId,
    nomeIndicado: lead.nome,
    empresa: lead.empresa,
    contato: lead.telefone,
    comissaoPercentual: lead.comissaoIndicacaoPercentual,
    leadId: lead.id,
  };

  if (existente) {
    actions.updateIndicacao(id, dados);
  } else {
    actions.addIndicacao({ id, status: "Novo", data: lead.dataEntrada, ...dados });
  }
}
