import {
  ROTINAS_CONTABEIS_MENSAIS,
  ROTINAS_PESSOAL_FIXAS,
  ROTINAS_PESSOAL_VARIAVEIS,
  ROTINAS_MEI,
  rotinasFiscaisMensaisFor,
  rotinasContabeisFor,
  rotinasPessoalMensalFor,
  setorAtendidoPelaEleven,
  type Client,
  type ChecklistEntry,
  type ChecklistStatus,
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
}

type AjusteVencimento = "antecipa" | "prorroga" | "nenhum";

/** Regras de vencimento passadas pela Kauane — "antecipa" move pro dia útil
 * anterior quando a data cai em fim de semana/feriado nacional, "prorroga"
 * move pro próximo dia útil, "nenhum" mantém o dia fixo mesmo caindo num
 * fim de semana. */
const REGRAS_VENCIMENTO_ROTINA: Record<string, { dia: number; ajuste: AjusteVencimento }> = {
  "Emissão e Envio do INSS e IRRF": { dia: 20, ajuste: "antecipa" },
  "Emissão e Envio do FGTS": { dia: 20, ajuste: "antecipa" },
  "EFD-Reinf": { dia: 15, ajuste: "antecipa" },
  "Envio da guia do DAS": { dia: 20, ajuste: "prorroga" },
  "Emissão guia DAE": { dia: 10, ajuste: "nenhum" },
  "Encerramento ISS": { dia: 10, ajuste: "nenhum" },
  "Entrega da DCTFWeb": { dia: 30, ajuste: "antecipa" },
};

/** Vencimento ("YYYY-MM-DD") da rotina nessa competência, ou undefined
 * quando não há regra de prazo cadastrada pra ela. */
export function vencimentoRotina(tipo: string, competencia: string): string | undefined {
  const regra = REGRAS_VENCIMENTO_ROTINA[tipo];
  if (!regra) return undefined;
  const [anoStr, mesStr] = competencia.split("-");
  const ano = Number(anoStr);
  const mesIdx = Number(mesStr) - 1;
  const ultimoDiaDoMes = new Date(ano, mesIdx + 1, 0).getDate();
  const dia = Math.min(regra.dia, ultimoDiaDoMes);
  const base = new Date(ano, mesIdx, dia);
  const ajustada = regra.ajuste === "antecipa" ? diaUtilAnterior(base) : regra.ajuste === "prorroga" ? diaUtilPosterior(base) : base;
  return `${ajustada.getFullYear()}-${String(ajustada.getMonth() + 1).padStart(2, "0")}-${String(ajustada.getDate()).padStart(2, "0")}`;
}

function clientesAtivosNoSetor(clients: Client[], setor: "fiscal" | "contabil" | "pessoal"): Client[] {
  return clients.filter(
    (c) => (c.status === "Ativo" || c.status === "Com pendência" || c.status === "Onboarding") && setorAtendidoPelaEleven(c, setor)
  );
}

function statusDe(checklist: ChecklistEntry[], clienteId: string, competencia: string, rotina: string): ChecklistStatus {
  return checklist.find((e) => e.clienteId === clienteId && e.competencia === competencia && e.rotina === rotina)?.status ?? "Pendente";
}

/** Todas as rotinas mensais dos 4 departamentos, aplicáveis a cada cliente
 * conforme o regime/config dele, numa competência específica. */
export function rotinasDepartamentosDoMes(
  clients: Client[],
  checklistFiscal: ChecklistEntry[],
  checklistContabil: ChecklistEntry[],
  checklistPessoal: ChecklistEntry[],
  checklistMei: ChecklistEntry[],
  competencia: string
): RotinaDepartamento[] {
  const rotinas: RotinaDepartamento[] = [];

  for (const c of clientesAtivosNoSetor(clients, "fiscal")) {
    for (const rotina of rotinasFiscaisMensaisFor(c)) {
      rotinas.push({
        id: `fiscal-${c.id}-${competencia}-${rotina}`,
        clienteId: c.id,
        tipo: rotina,
        setor: "Fiscal",
        competencia,
        status: statusDe(checklistFiscal, c.id, competencia, rotina),
        vencimento: vencimentoRotina(rotina, competencia),
      });
    }
  }

  for (const c of clientesAtivosNoSetor(clients, "contabil")) {
    for (const rotina of rotinasContabeisFor(c, ROTINAS_CONTABEIS_MENSAIS)) {
      rotinas.push({
        id: `contabil-${c.id}-${competencia}-${rotina}`,
        clienteId: c.id,
        tipo: rotina,
        setor: "Contábil",
        competencia,
        status: statusDe(checklistContabil, c.id, competencia, rotina),
        vencimento: vencimentoRotina(rotina, competencia),
      });
    }
  }

  for (const c of clientesAtivosNoSetor(clients, "pessoal")) {
    for (const rotina of rotinasPessoalMensalFor(c, [...ROTINAS_PESSOAL_FIXAS, ...ROTINAS_PESSOAL_VARIAVEIS])) {
      rotinas.push({
        id: `pessoal-${c.id}-${competencia}-${rotina}`,
        clienteId: c.id,
        tipo: rotina,
        setor: "Departamento Pessoal",
        competencia,
        status: statusDe(checklistPessoal, c.id, competencia, rotina),
        vencimento: vencimentoRotina(rotina, competencia),
      });
    }
  }

  for (const c of clients.filter(
    (cl) =>
      cl.dados.regimeTributario === "MEI" &&
      (cl.status === "Ativo" || cl.status === "Com pendência" || cl.status === "Onboarding") &&
      cl.criadoEm.slice(0, 7) <= competencia
  )) {
    for (const rotina of ROTINAS_MEI) {
      rotinas.push({
        id: `mei-${c.id}-${competencia}-${rotina}`,
        clienteId: c.id,
        tipo: rotina,
        setor: "MEI",
        competencia,
        status: statusDe(checklistMei, c.id, competencia, rotina),
        vencimento: vencimentoRotina(rotina, competencia),
      });
    }
  }

  return rotinas;
}
