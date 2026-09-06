import type { Obligation, Task, TeamMember } from "@/lib/types";

export interface ProdutividadeMembro {
  membroId: string;
  nome: string;
  tarefasAtivas: number;
  tarefasAtrasadas: number;
  obrigacoesConcluidasMes: number;
  obrigacoesAtrasadas: number;
}

const STATUS_TASK_FINALIZADOS = ["Concluída", "Cancelada"];
const STATUS_OBRIGACAO_FINALIZADOS = ["Concluído", "Não aplicável"];

/**
 * Carga e desempenho de cada colaborador ativo: tarefas em aberto/atrasadas
 * (Tarefas não guarda data de conclusão, então "atrasada" é o único corte
 * temporal possível) e obrigações concluídas no mês/atrasadas (Obrigação já
 * guarda dataConclusao, isso permite contar por competência).
 */
export function calcularProdutividade(
  team: TeamMember[],
  tasks: Task[],
  obligations: Obligation[],
  mesAtual: string
): ProdutividadeMembro[] {
  const hoje = new Date().toISOString().slice(0, 10);

  return team
    .filter((m) => m.ativo)
    .map((m) => {
      const tarefasDoMembro = tasks.filter((t) => t.responsavelId === m.id);
      const tarefasAbertas = tarefasDoMembro.filter((t) => !STATUS_TASK_FINALIZADOS.includes(t.status));
      const tarefasAtrasadas = tarefasAbertas.filter((t) => t.prazo < hoje);

      const obrigacoesDoMembro = obligations.filter((o) => o.responsavelId === m.id);
      const obrigacoesConcluidasMes = obrigacoesDoMembro.filter(
        (o) => o.status === "Concluído" && o.dataConclusao?.slice(0, 7) === mesAtual
      );
      const obrigacoesAtrasadas = obrigacoesDoMembro.filter(
        (o) => !STATUS_OBRIGACAO_FINALIZADOS.includes(o.status) && o.vencimento < hoje
      );

      return {
        membroId: m.id,
        nome: m.nome,
        tarefasAtivas: tarefasAbertas.length,
        tarefasAtrasadas: tarefasAtrasadas.length,
        obrigacoesConcluidasMes: obrigacoesConcluidasMes.length,
        obrigacoesAtrasadas: obrigacoesAtrasadas.length,
      };
    });
}
