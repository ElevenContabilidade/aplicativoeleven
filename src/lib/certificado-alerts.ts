import type { AppNotification, Certificado, Client } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const ALERT_WINDOW_DAYS = 30;

function diffDays(dateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateIso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function certificadoAlertId(certificadoId: string): string {
  return `cert-alert-${certificadoId}`;
}

function clientLabel(clienteId: string, clients: Client[]): string {
  const client = clients.find((c) => c.id === clienteId);
  return client?.dados.nomeFantasia ?? client?.dados.razaoSocial ?? "Cliente";
}

function buildCertificadoAlert(certificado: Certificado, clients: Client[]): AppNotification | null {
  const dias = diffDays(certificado.dataVencimento);
  if (dias > ALERT_WINDOW_DAYS) return null;

  const nomeCliente = clientLabel(certificado.clienteId, clients);
  const titulo =
    dias < 0
      ? "Certificado vencido"
      : dias === 0
        ? "Certificado vence hoje"
        : `Certificado vencendo em ${dias} dia${dias === 1 ? "" : "s"}`;
  const descricao =
    dias < 0
      ? `${nomeCliente} — ${certificado.tipo} está vencido há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"}.`
      : `${nomeCliente} — ${certificado.tipo} vence em ${formatDate(certificado.dataVencimento)}.`;

  return {
    id: certificadoAlertId(certificado.id),
    tipo: "certificado",
    titulo,
    descricao,
    data: new Date().toISOString().slice(0, 10),
    lida: false,
    href: "/certificados",
  };
}

/**
 * Recomputes every "certificado vencendo" alert from the current `certificados` list
 * and merges it into `notifications`, preserving read state for alerts that already
 * existed. Certificados outside the alert window (or já entregues e em dia) have
 * their alert removed.
 */
export function syncCertificadoAlerts(
  notifications: AppNotification[],
  certificados: Certificado[],
  clients: Client[]
): AppNotification[] {
  const existingById = new Map(notifications.filter((n) => n.id.startsWith("cert-alert-")).map((n) => [n.id, n]));
  const others = notifications.filter((n) => !n.id.startsWith("cert-alert-"));

  const alerts = certificados
    .map((c) => {
      const built = buildCertificadoAlert(c, clients);
      if (!built) return null;
      const existing = existingById.get(built.id);
      return existing ? { ...built, lida: existing.lida } : built;
    })
    .filter((n): n is AppNotification => n !== null);

  return [...alerts, ...others];
}
