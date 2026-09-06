import type { AppNotification, Client } from "@/lib/types";

const MESES_PARA_ALERTA = 12;

function dataBase(client: Client): string | undefined {
  return client.financeiro.dataUltimoReajuste || client.financeiro.inicioContrato;
}

function mesesDesde(dataIso: string): number {
  const base = new Date(`${dataIso}T00:00:00`);
  const hoje = new Date();
  let meses = (hoje.getFullYear() - base.getFullYear()) * 12 + (hoje.getMonth() - base.getMonth());
  if (hoje.getDate() < base.getDate()) meses -= 1;
  return Math.max(0, meses);
}

/** Meses desde o último reajuste (ou desde o início do contrato, se nunca
 * reajustou) — null quando o cliente não tem nem uma data pra calcular. */
export function mesesSemReajuste(client: Client): number | null {
  const base = dataBase(client);
  if (!base) return null;
  return mesesDesde(base);
}

export function reajusteAlertId(clienteId: string): string {
  return `reajuste-alert-${clienteId}`;
}

function buildReajusteAlert(client: Client): AppNotification | null {
  const meses = mesesSemReajuste(client);
  if (meses === null || meses < MESES_PARA_ALERTA) return null;

  const nome = client.dados.nomeFantasia || client.dados.razaoSocial;
  return {
    id: reajusteAlertId(client.id),
    tipo: "reajuste",
    titulo: "Reajuste de honorário pendente",
    descricao: `${nome} está há ${meses} meses sem reajuste de honorário.`,
    data: new Date().toISOString().slice(0, 10),
    lida: false,
    href: `/clientes/${client.id}`,
  };
}

/**
 * Recomputes every "reajuste pendente" alert from the current `clients` list
 * and merges it into `notifications`, preserving read state for alerts that
 * already existed. Só considera clientes com honorário mensal cadastrado
 * (valorMensal > 0) — evita alertar sobre lead/onboarding sem contrato ativo.
 */
export function syncReajusteAlerts(notifications: AppNotification[], clients: Client[]): AppNotification[] {
  const prefix = "reajuste-alert-";
  const existingById = new Map(notifications.filter((n) => n.id.startsWith(prefix)).map((n) => [n.id, n]));
  const others = notifications.filter((n) => !n.id.startsWith(prefix));

  const alerts = clients
    .filter((c) => (c.financeiro.valorMensal ?? 0) > 0)
    .map((c) => {
      const built = buildReajusteAlert(c);
      if (!built) return null;
      const existing = existingById.get(built.id);
      return existing ? { ...built, lida: existing.lida } : built;
    })
    .filter((n): n is AppNotification => n !== null);

  return [...alerts, ...others];
}
