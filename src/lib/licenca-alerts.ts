import type { AppNotification, Client, Licenca } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const ALERT_WINDOW_DAYS = 30;

function diffDays(dateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateIso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function licencaAlertId(licencaId: string): string {
  return `lic-alert-${licencaId}`;
}

function clientLabel(clienteId: string, clients: Client[]): string {
  const client = clients.find((c) => c.id === clienteId);
  return client?.dados.nomeFantasia ?? client?.dados.razaoSocial ?? "Cliente";
}

function buildLicencaAlert(licenca: Licenca, clients: Client[]): AppNotification | null {
  const dias = diffDays(licenca.dataVencimento);
  if (dias > ALERT_WINDOW_DAYS) return null;

  const nomeCliente = clientLabel(licenca.clienteId, clients);
  const titulo =
    dias < 0 ? "Licença vencida" : dias === 0 ? "Licença vence hoje" : `Licença vencendo em ${dias} dia${dias === 1 ? "" : "s"}`;
  const descricao =
    dias < 0
      ? `${licenca.nome} — ${nomeCliente} está vencida há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}.`
      : `${licenca.nome} — ${nomeCliente} vence em ${formatDate(licenca.dataVencimento)}.`;

  return {
    id: licencaAlertId(licenca.id),
    tipo: "licenca",
    titulo,
    descricao,
    data: new Date().toISOString().slice(0, 10),
    lida: false,
    href: `/clientes/${licenca.clienteId}`,
  };
}

/**
 * Recomputes every "licença vencendo" alert from the current `licencas` list and
 * merges it into `notifications`, preserving read state for alerts that already
 * existed. Licenças outside the alert window have their alert removed.
 */
export function syncLicencaAlerts(
  notifications: AppNotification[],
  licencas: Licenca[],
  clients: Client[]
): AppNotification[] {
  const existingById = new Map(notifications.filter((n) => n.id.startsWith("lic-alert-")).map((n) => [n.id, n]));
  const others = notifications.filter((n) => !n.id.startsWith("lic-alert-"));

  const alerts = licencas
    .map((l) => {
      const built = buildLicencaAlert(l, clients);
      if (!built) return null;
      const existing = existingById.get(built.id);
      return existing ? { ...built, lida: existing.lida } : built;
    })
    .filter((n): n is AppNotification => n !== null);

  return [...alerts, ...others];
}
