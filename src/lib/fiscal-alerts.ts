import type { AppNotification, ChecklistEntry, Client } from "@/lib/types";

const ROTINA = "Encerramento ISS";
const DEADLINE_DAY = 10;
const LOOKBACK_MONTHS = 3;

function isDone(status?: string) {
  return status === "OK" || status === "Dispensada";
}

function clientLabel(clienteId: string, clients: Client[]): string {
  const client = clients.find((c) => c.id === clienteId);
  return client?.dados.nomeFantasia ?? client?.dados.razaoSocial ?? "Cliente";
}

export function fiscalIssAlertId(clienteId: string, competencia: string): string {
  return `fiscal-iss-alert-${clienteId}-${competencia}`;
}

function competenciasParaChecar(): string[] {
  const hoje = new Date();
  const list: string[] = [];
  for (let i = 0; i < LOOKBACK_MONTHS; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return list;
}

function prazoVencido(competencia: string): boolean {
  const [year, month] = competencia.split("-").map(Number);
  const prazo = new Date(year, month - 1, DEADLINE_DAY, 23, 59, 59);
  return new Date() > prazo;
}

/**
 * Recomputes every "Encerramento ISS atrasado" alert from the current
 * `checklistFiscal` list — one per cliente/competência still not marcada
 * como OK/Dispensada depois do dia 10. Preserves read state for alerts
 * that already existed.
 */
export function syncFiscalAlerts(
  notifications: AppNotification[],
  checklistFiscal: ChecklistEntry[],
  clients: Client[]
): AppNotification[] {
  const existingById = new Map(notifications.filter((n) => n.id.startsWith("fiscal-iss-alert-")).map((n) => [n.id, n]));
  const others = notifications.filter((n) => !n.id.startsWith("fiscal-iss-alert-"));

  const clientesFiscal = clients.filter((c) => c.responsaveis.fiscal);
  const competencias = competenciasParaChecar().filter(prazoVencido);

  const alerts: AppNotification[] = [];
  for (const c of clientesFiscal) {
    for (const competencia of competencias) {
      const entry = checklistFiscal.find((e) => e.clienteId === c.id && e.competencia === competencia && e.rotina === ROTINA);
      if (isDone(entry?.status)) continue;

      const id = fiscalIssAlertId(c.id, competencia);
      const [year, month] = competencia.split("-");
      alerts.push({
        id,
        tipo: "fiscal",
        titulo: "Encerramento do ISS atrasado",
        descricao: `${clientLabel(c.id, clients)} — encerramento do ISS de ${month}/${year} não foi concluído até o dia ${DEADLINE_DAY}.`,
        data: new Date().toISOString().slice(0, 10),
        lida: existingById.get(id)?.lida ?? false,
        href: "/fiscal",
      });
    }
  }

  return [...alerts, ...others];
}
