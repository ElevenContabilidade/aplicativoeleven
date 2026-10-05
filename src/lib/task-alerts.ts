import type { AppNotification, Client, Task } from "@/lib/types";

function clientLabel(clienteId: string | undefined, clients: Client[]): string | undefined {
  if (!clienteId) return undefined;
  const client = clients.find((c) => c.id === clienteId);
  return client?.dados.nomeFantasia ?? client?.dados.razaoSocial;
}

export function taskAlertId(taskId: string): string {
  return `task-alert-${taskId}`;
}

/** Tarefa concluída não precisa mais avisar o responsável. */
function buildTaskAlert(task: Task, clients: Client[]): AppNotification | null {
  if (task.status === "Concluída") return null;
  const nomeCliente = clientLabel(task.clienteId, clients);
  return {
    id: taskAlertId(task.id),
    tipo: "tarefa",
    titulo: "Tarefa atribuída a você",
    descricao: `${task.titulo}${nomeCliente ? ` — ${nomeCliente}` : ""}`,
    data: new Date().toISOString(),
    lida: false,
    href: "/tarefas",
    destinatarioId: task.responsavelId,
  };
}

/**
 * Recomputes every "tarefa atribuída a você" alert a partir da lista atual
 * de `tasks` — um por tarefa ainda não concluída, endereçado ao responsável
 * (destinatarioId), preservando o estado de lida das que já existiam.
 * Tarefa concluída, excluída ou reatribuída perde/atualiza o alerta.
 */
export function syncTaskAlerts(notifications: AppNotification[], tasks: Task[], clients: Client[]): AppNotification[] {
  const existingById = new Map(notifications.filter((n) => n.id.startsWith("task-alert-")).map((n) => [n.id, n]));
  const others = notifications.filter((n) => !n.id.startsWith("task-alert-"));

  const alerts = tasks
    .map((t) => {
      const built = buildTaskAlert(t, clients);
      if (!built) return null;
      const existing = existingById.get(built.id);
      // Só mantém "lida" se o responsável não mudou — reatribuir a tarefa
      // pra outra pessoa é um aviso novo pra ela, mesmo que o antigo
      // responsável já tivesse visto. A data também é preservada do alerta
      // original — sem isso, toda tarefa em aberto "nascia de novo" hoje a
      // cada resync, e os alertas mais recentes nunca ficavam ordenados na
      // frente dos mais antigos.
      const mesmoDestinatario = existing && existing.destinatarioId === built.destinatarioId;
      return { ...built, lida: mesmoDestinatario ? existing.lida : false, data: mesmoDestinatario ? existing.data : built.data };
    })
    .filter((n): n is AppNotification => n !== null);

  return [...alerts, ...others];
}
