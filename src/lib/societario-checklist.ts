import {
  ETAPAS_ABERTURA_EMPRESA,
  ETAPAS_ABERTURA_GRUPOS,
  ETAPAS_ALTERACAO_EMPRESA,
  ETAPAS_ALTERACAO_GRUPOS,
  type EtapaProcesso,
} from "@/lib/types";

export interface EtapaGrupoDef {
  label: string;
  count: number;
  color: string;
}

/** Checklist padrão (etapas + faixas agrupadas) por tipo de serviço — fonte
 * única usada tanto pra gerar as etapas de um processo novo quanto pra
 * desenhar o checklist expandido em AberturaMatrix. */
export const CHECKLISTS_POR_TIPO: Record<string, { etapas: readonly string[]; grupos: readonly EtapaGrupoDef[] }> = {
  Abertura: { etapas: ETAPAS_ABERTURA_EMPRESA, grupos: ETAPAS_ABERTURA_GRUPOS },
  "Abertura de empresa": { etapas: ETAPAS_ABERTURA_EMPRESA, grupos: ETAPAS_ABERTURA_GRUPOS },
  Alteração: { etapas: ETAPAS_ALTERACAO_EMPRESA, grupos: ETAPAS_ALTERACAO_GRUPOS },
};

function novaEtapa(descricao: string, i: number, responsavelId: string, inicio: string, prazo: string): EtapaProcesso {
  return { id: `et-${Date.now()}-${i}`, descricao, responsavelId, inicio, prazo, status: "Pendente" };
}

/** Gera as etapas de um processo novo a partir do checklist padrão do seu
 * tipo de serviço (lista vazia se o tipo não tiver checklist definido). */
export function etapasPadrao(tipoServico: string, responsavelId: string, inicio: string, prazo: string): EtapaProcesso[] {
  const template = CHECKLISTS_POR_TIPO[tipoServico]?.etapas ?? [];
  return template.map((descricao, i) => novaEtapa(descricao, i, responsavelId, inicio, prazo));
}

/** Fatia o checklist padrão de um tipo nos grupos/fases definidos — usado
 * pelo checklist expandido em AberturaMatrix. */
export function gruposComEtapas(tipoServico: string) {
  const def = CHECKLISTS_POR_TIPO[tipoServico];
  if (!def) return [];
  let offset = 0;
  return def.grupos.map((g) => {
    const etapas = def.etapas.slice(offset, offset + g.count);
    offset += g.count;
    return { ...g, etapas };
  });
}

/**
 * Recria as etapas de um processo a partir do checklist padrão atual do seu
 * tipo de serviço, preservando o status (e demais dados) de quem já tinha a
 * mesma descrição — usado pra "sincronizar" um processo já criado depois que
 * o checklist padrão muda, ou pra aplicar o checklist retroativamente num
 * processo que nasceu sem etapas.
 */
export function etapasAtualizadas(
  tipoServico: string,
  etapasAtuais: EtapaProcesso[],
  responsavelId: string,
  inicio: string,
  prazo: string
): EtapaProcesso[] {
  const template = CHECKLISTS_POR_TIPO[tipoServico]?.etapas ?? [];
  return template.map((descricao, i) => {
    const existente = etapasAtuais.find((e) => e.descricao === descricao);
    return existente ?? novaEtapa(descricao, i, responsavelId, inicio, prazo);
  });
}
