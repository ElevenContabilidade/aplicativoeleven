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

export type SetorRotina = "Fiscal" | "Contábil" | "Departamento Pessoal" | "MEI";

/** Uma rotina de departamento (Fiscal/Contábil/DP/MEI), representada no
 * mesmo formato de "obrigação" pra aparecer junto com as obrigações
 * cadastradas manualmente. `status` vem direto do checklist do
 * departamento — marcar "OK" lá reflete aqui automaticamente, porque é o
 * mesmo dado, não uma cópia sincronizada. */
export interface RotinaDepartamento {
  id: string;
  clienteId: string;
  tipo: string;
  setor: SetorRotina;
  competencia: string;
  status: ChecklistStatus;
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
      });
    }
  }

  return rotinas;
}
