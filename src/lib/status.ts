export type BadgeTone = "wine" | "cream" | "success" | "warning" | "danger" | "info" | "neutral" | "outline";

const map: Record<string, BadgeTone> = {
  // cliente
  lead: "outline",
  "em negociação": "info",
  onboarding: "cream",
  implantação: "cream",
  ativo: "success",
  "com pendência": "warning",
  suspenso: "danger",
  "em processo de cancelamento": "danger",
  encerrado: "neutral",

  // financeiro
  pago: "success",
  "em aberto": "info",
  atrasado: "danger",
  negociado: "warning",
  cancelado: "neutral",

  // tarefas / obrigações
  "não iniciada": "neutral",
  "a fazer": "neutral",
  "em andamento": "info",
  "aguardando cliente": "warning",
  "aguardando órgão": "warning",
  "aguardando informação": "warning",
  "em análise": "info",
  concluída: "success",
  concluído: "success",
  "não aplicável": "neutral",
  "em atraso": "danger",

  // comercial / kanban
  "lead recebido": "outline",
  "primeiro contato": "info",
  "contato realizado": "info",
  qualificação: "info",
  "reunião agendada": "cream",
  "reunião realizada": "cream",
  "proposta enviada": "warning",
  negociação: "warning",
  "aguardando retorno": "warning",
  fechado: "success",
  perdido: "danger",

  // certificados
  "agendamento solicitado": "neutral",
  "agendamento realizado": "info",
  "aguardando validação": "warning",
  validado: "info",
  "certificado aprovado": "cream",
  entregue: "success",
  "renovação próxima": "warning",
  vencido: "danger",

  // societário
  solicitado: "neutral",
  documentação: "info",
  protocolo: "info",
  exigência: "warning",
  aprovado: "success",
  finalizado: "success",

  // prioridade
  baixa: "neutral",
  normal: "info",
  alta: "warning",
  urgente: "danger",
};

export function toneFor(status: string): BadgeTone {
  return map[status.toLowerCase()] ?? "neutral";
}
