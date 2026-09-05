import type { AppNotification, Client, Documento } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const JANELA_ALERTA_DIAS = 14;

function diasDesde(dataIso: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const data = new Date(`${dataIso}T00:00:00`);
  return Math.round((hoje.getTime() - data.getTime()) / 86_400_000);
}

export function documentoAlertId(documentoId: string): string {
  return `doc-alert-${documentoId}`;
}

function clientLabel(clienteId: string, clients: Client[]): string {
  const client = clients.find((c) => c.id === clienteId);
  return client?.dados.nomeFantasia ?? client?.dados.razaoSocial ?? "Cliente";
}

/** Documentos enviados pela equipe (têm responsavelId) não geram alerta —
 * só interessa avisar quando quem anexou foi o próprio cliente, pelo Portal. */
function buildDocumentoAlert(documento: Documento, clients: Client[]): AppNotification | null {
  if (documento.responsavelId) return null;
  if (diasDesde(documento.dataArquivo) > JANELA_ALERTA_DIAS) return null;

  const nomeCliente = clientLabel(documento.clienteId, clients);
  return {
    id: documentoAlertId(documento.id),
    tipo: "documento",
    titulo: "Novo documento do cliente",
    descricao: `${nomeCliente} enviou "${documento.nome}" (${documento.categoria}) em ${formatDate(documento.dataArquivo)}.`,
    data: documento.dataArquivo,
    lida: false,
    href: `/clientes/${documento.clienteId}`,
  };
}

/**
 * Recomputes every "novo documento do cliente" alert from the current
 * `documentos` list and merges it into `notifications`, preserving read
 * state for alerts that already existed. Documentos enviados pela equipe ou
 * fora da janela de alerta não geram (ou perdem) o alerta.
 */
export function syncDocumentoAlerts(
  notifications: AppNotification[],
  documentos: Documento[],
  clients: Client[]
): AppNotification[] {
  const existingById = new Map(notifications.filter((n) => n.id.startsWith("doc-alert-")).map((n) => [n.id, n]));
  const others = notifications.filter((n) => !n.id.startsWith("doc-alert-"));

  const alerts = documentos
    .map((d) => {
      const built = buildDocumentoAlert(d, clients);
      if (!built) return null;
      const existing = existingById.get(built.id);
      return existing ? { ...built, lida: existing.lida } : built;
    })
    .filter((n): n is AppNotification => n !== null);

  return [...alerts, ...others];
}
