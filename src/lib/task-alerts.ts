import type { AppNotification, Client, Task } from "@/lib/types";

function clientLabel(clienteId: string | undefined, clients: Client[]): string | undefined {
  if (!clienteId) return undefined;
  const client = clients.find((c) => c.id === clienteId);
  return client?.dados.nomeFantasia ?? client?.dados.razaoSocial;
}

/** Tarefas são criadas com id `t-<Date.now()>` — reaproveita esse timestamp
 * como data real de criação (tarefas antigas da base de exemplo, sem esse
 * formato, caem no início dos tempos em vez de aparecerem como "agora"). */
function dataCriacaoTask(taskId: string): string {
  const match = taskId.match(/^t-(\d+)/);
  return new Date(match ? Number(match[1]) : 0).toISOString();
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
    // `notifications` é recalculado do zero a cada carregamento da página,
    // então "agora" fazia todo alerta empatar na ordenação — usa a data de
    // criação real da tarefa em vez disso.
    data: dataCriacaoTask(task.id),
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
      // responsável já tivesse visto.
      const mesmoDestinatario = existing && existing.destinatarioId === built.destinatarioId;
      return { ...built, lida: mesmoDestinatario ? existing.lida : false };
    })
    .filter((n): n is AppNotification => n !== null);

  return [...alerts, ...others];
}
