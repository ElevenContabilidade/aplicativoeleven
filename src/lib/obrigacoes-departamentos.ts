import {
  ROTINAS_CONTABEIS_MENSAIS,
  ROTINAS_PESSOAL_FIXAS,
  ROTINAS_PESSOAL_VARIAVEIS,
  ROTINAS_MEI,
  rotinasFiscaisMensaisFor,
  rotinasContabeisFor,
  rotinasPessoalMensalFor,
  setorAtendidoPelaEleven,
  clienteAtivoNaCompetencia,
  type Client,
  type ChecklistEntry,
  type ChecklistStatus,
  type DispensaRotina,
} from "@/lib/types";
import { diaUtilAnterior, diaUtilPosterior } from "@/lib/feriados";

export type SetorRotina = "Fiscal" | "Contábil" | "Departamento Pessoal" | "MEI";

/** Uma rotina de departamento (Fiscal/Contábil/DP/MEI), representada no
 * mesmo formato de "obrigação" pra aparecer junto com as obrigações
 * cadastradas manualmente. `status` vem direto do checklist do
 * departamento — marcar "OK" lá reflete aqui automaticamente, porque é o
 * mesmo dado, não uma cópia sincronizada. `vencimento` só existe pras
 * rotinas com regra de prazo conhecida (ver REGRAS_VENCIMENTO_ROTINA) — as
 * demais continuam sem data, só com status mensal. */
export interface RotinaDepartamento {
  id: string;
  clienteId: string;
  tipo: string;
  setor: SetorRotina;
  competencia: string;
  status: ChecklistStatus;
  vencimento?: string;
  /** Primeiro dia da competência, só preenchido junto com `vencimento` —
   * usado como início "genérico" da barra no gráfico de Gantt semanal
   * (ainda não existe uma regra de início por rotina, então assume que ela
   * pode começar assim que o mês abre). */
  inicio?: string;
}

export type AjusteVencimento = "antecipa" | "prorroga" | "nenhum";

export interface RegraVencimento {
  dia: number;
  ajuste: AjusteVencimento;
}

/** Regras de vencimento passadas pela Kauane — "antecipa" move pro dia útil
 * anterior quando a data cai em fim de semana/feriado nacional, "prorroga"
 * move pro próximo dia útil, "nenhum" mantém o dia fixo mesmo caindo num
 * fim de semana. Esse é só o padrão de fábrica — a Kauane pode sobrescrever
 * qualquer uma dessas (ou cadastrar regra pra uma rotina nova) pela aba
 * Configurações de Obrigações, que manda o override em `overrides`. */
export const REGRAS_VENCIMENTO_ROTINA_PADRAO: Record<string, RegraVencimento> = {
  "Emissão e Envio do INSS e IRRF": { dia: 20, ajuste: "antecipa" },
  "Emissão e Envio do FGTS": { dia: 20, ajuste: "antecipa" },
  "EFD-Reinf": { dia: 15, ajuste: "antecipa" },
  "Envio da guia do DAS": { dia: 20, ajuste: "prorroga" },
  "Emissão guia DAE": { dia: 10, ajuste: "nenhum" },
  "EFD-ICMS": { dia: 20, ajuste: "nenhum" },
  "Encerramento ISS": { dia: 10, ajuste: "nenhum" },
  "Entrega da DCTFWeb": { dia: 30, ajuste: "antecipa" },
};

/** Descrição legível da regra de prazo dessa rotina (dia-base + o que
 * acontece quando cai em fim de semana/feriado), ou undefined quando não
 * há regra cadastrada (nem padrão, nem override) — usado pra explicar o
 * vencimento na tela. */
export function regraVencimentoRotina(
  tipo: string,
  overrides: Record<string, RegraVencimento> = {}
): { dia: number; descricaoAjuste: string } | undefined {
  const regra = overrides[tipo] ?? REGRAS_VENCIMENTO_ROTINA_PADRAO[tipo];
  if (!regra) return undefined;
  const descricaoAjuste =
    regra.ajuste === "antecipa"
      ? "Se cair em fim de semana ou feriado nacional, antecipa pro dia útil anterior."
      : regra.ajuste === "prorroga"
        ? "Se cair em fim de semana ou feriado nacional, prorroga pro próximo dia útil."
        : "Dia fixo, mesmo caindo em fim de semana ou feriado.";
  return { dia: regra.dia, descricaoAjuste };
}

/** Vencimento ("YYYY-MM-DD") da rotina referente a essa competência, ou
 * undefined quando não há regra de prazo cadastrada pra ela (nem padrão,
 * nem override). Regime de competência: a obrigação referente ao mês de
 * "competencia" vence no mês SEGUINTE (ex: competência setembro vence em
 * outubro) — por isso o cálculo sempre usa o mês de competência + 1. O
 * construtor Date rola o ano sozinho quando a competência é dezembro (mês
 * 12 vira janeiro do ano seguinte), sem precisar de ajuste manual. */
export function vencimentoRotina(tipo: string, competencia: string, overrides: Record<string, RegraVencimento> = {}): string | undefined {
  const regra = overrides[tipo] ?? REGRAS_VENCIMENTO_ROTINA_PADRAO[tipo];
  if (!regra) return undefined;
  const [anoStr, mesStr] = competencia.split("-");
  const ano = Number(anoStr);
  const mesVencimentoIdx = Number(mesStr); // mês de competência (1-based) == mês de vencimento (0-based, já +1)
  const ultimoDiaDoMesVencimento = new Date(ano, mesVencimentoIdx + 1, 0).getDate();
  const dia = Math.min(regra.dia, ultimoDiaDoMesVencimento);
  const base = new Date(ano, mesVencimentoIdx, dia);
  const ajustada = regra.ajuste === "antecipa" ? diaUtilAnterior(base) : regra.ajuste === "prorroga" ? diaUtilPosterior(base) : base;
  return `${ajustada.getFullYear()}-${String(ajustada.getMonth() + 1).padStart(2, "0")}-${String(ajustada.getDate()).padStart(2, "0")}`;
}

function clientesAtivosNoSetor(clients: Client[], setor: "fiscal" | "contabil" | "pessoal", competencia: string): Client[] {
  return clients.filter(
    (c) =>
      (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding") &&
      setorAtendidoPelaEleven(c, setor) &&
      clienteAtivoNaCompetencia(c, competencia)
  );
}

/** Cliente dispensado permanentemente dessa rotina (ver DispensaRotina) —
 * só vale enquanto não houver marcação própria naquele mês específico. */
export function isRotinaDispensada(dispensas: DispensaRotina[], clienteId: string, setor: SetorRotina, rotina: string): boolean {
  return dispensas.some((d) => d.clienteId === clienteId && d.setor === setor && d.rotina === rotina);
}

export interface RotinaDesativada {
  id: string;
  setor: SetorRotina;
  rotina: string;
}

/** Rotina desativada pro setor inteiro (configurado na aba Configurações
 * de Obrigações) — diferente de uma dispensa, que é por cliente; essa tira
 * a rotina de todo mundo do setor, pra sempre, até ser reativada. */
export function isRotinaDesativadaNoSetor(desativadas: RotinaDesativada[], setor: SetorRotina, rotina: string): boolean {
  return desativadas.some((d) => d.setor === setor && d.rotina === rotina);
}

function statusDe(
  checklist: ChecklistEntry[],
  clienteId: string,
  competencia: string,
  rotina: string,
  dispensada: boolean
): ChecklistStatus {
  const explicito = checklist.find((e) => e.clienteId === clienteId && e.competencia === competencia && e.rotina === rotina)?.status;
  return explicito ?? (dispensada ? "Dispensada" : "Pendente");
}

/** Todas as rotinas mensais dos 4 departamentos, aplicáveis a cada cliente
 * conforme o regime/config dele, numa competência específica. `overrides` e
 * `rotinasDesativadas` vêm da aba Configurações de Obrigações — sem eles,
 * usa as regras padrão e não tira nenhuma rotina. */
export function rotinasDepartamentosDoMes(
  clients: Client[],
  checklistFiscal: ChecklistEntry[],
  checklistContabil: ChecklistEntry[],
  checklistPessoal: ChecklistEntry[],
  checklistMei: ChecklistEntry[],
  competencia: string,
  dispensasRotina: DispensaRotina[] = [],
  overrides: Record<string, RegraVencimento> = {},
  rotinasDesativadas: RotinaDesativada[] = []
): RotinaDepartamento[] {
  const rotinas: RotinaDepartamento[] = [];
  const primeiroDiaCompetencia = `${competencia}-01`;

  function empurrar(clienteId: string, tipo: string, setor: SetorRotina, status: ChecklistStatus) {
    if (isRotinaDesativadaNoSetor(rotinasDesativadas, setor, tipo)) return;
    const vencimento = vencimentoRotina(tipo, competencia, overrides);
    rotinas.push({
      id: `${setor}-${clienteId}-${competencia}-${tipo}`,
      clienteId,
      tipo,
      setor,
      competencia,
      status,
      vencimento,
      inicio: vencimento ? primeiroDiaCompetencia : undefined,
    });
  }

  for (const c of clientesAtivosNoSetor(clients, "fiscal", competencia)) {
    for (const rotina of rotinasFiscaisMensaisFor(c)) {
      empurrar(c.id, rotina, "Fiscal", statusDe(checklistFiscal, c.id, competencia, rotina, isRotinaDispensada(dispensasRotina, c.id, "Fiscal", rotina)));
    }
  }

  for (const c of clientesAtivosNoSetor(clients, "contabil", competencia)) {
    for (const rotina of rotinasContabeisFor(c, ROTINAS_CONTABEIS_MENSAIS)) {
      empurrar(
        c.id,
        rotina,
        "Contábil",
        statusDe(checklistContabil, c.id, competencia, rotina, isRotinaDispensada(dispensasRotina, c.id, "Contábil", rotina))
      );
    }
  }

  for (const c of clientesAtivosNoSetor(clients, "pessoal", competencia)) {
    for (const rotina of rotinasPessoalMensalFor(c, [...ROTINAS_PESSOAL_FIXAS, ...ROTINAS_PESSOAL_VARIAVEIS])) {
      empurrar(
        c.id,
        rotina,
        "Departamento Pessoal",
        statusDe(checklistPessoal, c.id, competencia, rotina, isRotinaDispensada(dispensasRotina, c.id, "Departamento Pessoal", rotina))
      );
    }
  }

  // MEI usa a mesma regra de "a partir de qual mês entra" dos outros
  // setores (financeiro.inicioContrato) — antes usava a data de CRIAÇÃO do
  // cadastro no sistema (criadoEm), que não dava pra escolher: se a empresa
  // fosse cadastrada hoje mas devesse começar a aparecer só em dezembro
  // (ex: handover de outro escritório), não tinha como adiar.
  for (const c of clients.filter(
    (cl) =>
      cl.dados.regimeTributario === "MEI" &&
      (cl.status === "Ativo" || cl.status === "Com pendência" || cl.status === "Onboarding") &&
      clienteAtivoNaCompetencia(cl, competencia)
  )) {
    for (const rotina of ROTINAS_MEI) {
      empurrar(c.id, rotina, "MEI", statusDe(checklistMei, c.id, competencia, rotina, isRotinaDispensada(dispensasRotina, c.id, "MEI", rotina)));
    }
  }

  return rotinas;
}
